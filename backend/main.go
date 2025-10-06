package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/joho/godotenv"
)

type GenerateRequest struct {
	Prompt string `json:"prompt"`
}

type GenerateResponse struct {
	Options []string `json:"options"`
	Error   string   `json:"error,omitempty"`
}

type ClaudeRequest struct {
	Model     string    `json:"model"`
	MaxTokens int       `json:"max_tokens"`
	Messages  []Message `json:"messages"`
	Tools     []Tool    `json:"tools,omitempty"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type Tool struct {
	Type           string          `json:"type"`
	Name           string          `json:"name"`
	MaxUses        *int            `json:"max_uses,omitempty"`
	AllowedDomains []string        `json:"allowed_domains,omitempty"`
	BlockedDomains []string        `json:"blocked_domains,omitempty"`
	UserLocation   *UserLocation   `json:"user_location,omitempty"`
}

type UserLocation struct {
	Type    string `json:"type"`
	City    string `json:"city,omitempty"`
	State   string `json:"state,omitempty"`
	Country string `json:"country"`
}

type ClaudeResponse struct {
	Content []ContentBlock `json:"content"`
}

type ContentBlock struct {
	Type string `json:"type"`
	Text string `json:"text,omitempty"`
}

// Store current wheel options in memory
var (
	currentOptions []string
	optionsMutex   sync.RWMutex
)

func init() {
	// Initialize with default MLB teams
	currentOptions = []string{
		"Arizona Diamondbacks", "Atlanta Braves", "Baltimore Orioles", "Boston Red Sox",
		"Chicago Cubs", "Chicago White Sox", "Cincinnati Reds", "Cleveland Guardians",
		"Colorado Rockies", "Detroit Tigers", "Houston Astros", "Kansas City Royals",
		"Los Angeles Angels", "Los Angeles Dodgers", "Miami Marlins", "Milwaukee Brewers",
		"Minnesota Twins", "New York Mets", "New York Yankees", "Oakland Athletics",
		"Philadelphia Phillies", "Pittsburgh Pirates", "San Diego Padres", "San Francisco Giants",
		"Seattle Mariners", "St. Louis Cardinals", "Tampa Bay Rays", "Texas Rangers",
		"Toronto Blue Jays", "Washington Nationals",
	}
}

func main() {
	// Load .env file (optional, env vars come from docker-compose in container)
	_ = godotenv.Load()

	// API endpoints only - frontend is separate service
	http.HandleFunc("/api/generate-options", corsMiddleware(generateOptionsHandler))
	http.HandleFunc("/api/current-options", corsMiddleware(getCurrentOptionsHandler))
	http.HandleFunc("/api/health", corsMiddleware(healthHandler))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Backend API server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("GET /api/health")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func getCurrentOptionsHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("GET /api/current-options")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	optionsMutex.RLock()
	options := currentOptions
	optionsMutex.RUnlock()

	log.Printf("Returning %d current options", len(options))

	json.NewEncoder(w).Encode(GenerateResponse{
		Options: options,
	})
}

func generateOptionsHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("POST /api/generate-options")

	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding request: %v", err)
		json.NewEncoder(w).Encode(GenerateResponse{
			Error: "Invalid request format",
		})
		return
	}

	if req.Prompt == "" {
		json.NewEncoder(w).Encode(GenerateResponse{
			Error: "Prompt cannot be empty",
		})
		return
	}

	log.Printf("Received prompt: %q", req.Prompt)

	var options []string
	var err error

	// Detect if input is a comma-separated list
	if isCommaSeparatedList(req.Prompt) {
		options = parseCommaSeparatedList(req.Prompt)
		log.Printf("Parsed comma-separated list: %d items", len(options))
	} else {
		// Otherwise, call Claude API
		log.Printf("Calling Claude API for prompt: %q", req.Prompt)
		options, err = callClaudeAPI(req.Prompt)
		if err != nil {
			log.Printf("Error calling Claude API: %v", err)
			json.NewEncoder(w).Encode(GenerateResponse{
				Error: fmt.Sprintf("Failed to generate options: %v", err),
			})
			return
		}
		log.Printf("Claude API returned %d options", len(options))
	}

	// Update stored options
	optionsMutex.Lock()
	currentOptions = options
	optionsMutex.Unlock()

	log.Printf("Successfully generated %d options", len(options))

	json.NewEncoder(w).Encode(GenerateResponse{
		Options: options,
	})
}

func isCommaSeparatedList(input string) bool {
	// Check if input contains commas and doesn't look like a sentence
	if !strings.Contains(input, ",") {
		return false
	}

	// Split and check if we have multiple items
	parts := strings.Split(input, ",")
	if len(parts) < 2 {
		return false
	}

	// Check if items are relatively short (not full sentences)
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		// If any part is very long or contains multiple sentences, treat as prompt
		if len(trimmed) > 50 || strings.Count(trimmed, ".") > 0 {
			return false
		}
	}

	return true
}

func parseCommaSeparatedList(input string) []string {
	parts := strings.Split(input, ",")
	var options []string
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			options = append(options, trimmed)
		}
	}
	return options
}

func cleanResponseText(text string) string {
	// Remove common preamble patterns
	preambles := []string{
		"Based on my search results, ",
		"Based on my search, ",
		"Based on the search results, ",
		"I found ",
		"Here is the list: ",
		"Here are the items: ",
		"The list is: ",
	}

	cleaned := text
	for _, preamble := range preambles {
		cleaned = strings.Replace(cleaned, preamble, "", 1)
	}

	// If there's a colon followed by items, take everything after the last colon
	if idx := strings.LastIndex(cleaned, ":\n"); idx != -1 {
		cleaned = cleaned[idx+2:]
	} else if idx := strings.LastIndex(cleaned, ": "); idx != -1 {
		cleaned = cleaned[idx+2:]
	}

	// Remove any leading/trailing whitespace and newlines
	cleaned = strings.TrimSpace(cleaned)

	// If the text starts with a sentence (contains period before first comma),
	// try to extract just the comma-separated part
	firstComma := strings.Index(cleaned, ",")
	firstPeriod := strings.Index(cleaned, ".")

	if firstPeriod != -1 && firstComma != -1 && firstPeriod < firstComma {
		// Find the last sentence-ending period before the list starts
		lines := strings.Split(cleaned, "\n")
		for i, line := range lines {
			if strings.Contains(line, ",") && !strings.Contains(line, ". ") {
				// This line looks like it's the start of the comma-separated list
				cleaned = strings.Join(lines[i:], "\n")
				break
			}
		}
	}

	return cleaned
}

func callClaudeAPI(prompt string) ([]string, error) {
	apiKey := os.Getenv("CLAUDE_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("CLAUDE_API_KEY environment variable not set")
	}

	claudePrompt := fmt.Sprintf(`Generate a complete comma-separated list of ALL items for: %s.

WHEN TO USE WEB SEARCH:
- Only use web search if the request requires current/real-time information (e.g., "today's roster", "current menu", "restaurants at [specific location]")
- Do NOT use web search for static, well-known lists (e.g., "NBA teams", "NFL teams", "US states", "countries")

OUTPUT FORMAT - CRITICAL:
Your response must contain ONLY the comma-separated list. Do not include:
- Any explanatory text or preamble (like "Based on my search results" or "I found")
- No sentences or explanations
- No numbering
- No extra text before or after the list
- Just the comma-separated items only

Example format: Item One, Item Two, Item Three, Item Four

Return ONLY the comma-separated list.`, prompt)

	// Configure web search tool
	maxUses := 5
	tools := []Tool{
		{
			Type:    "web_search_20250305",
			Name:    "web_search",
			MaxUses: &maxUses,
		},
	}

	reqBody := ClaudeRequest{
		Model:     "claude-sonnet-4-5-20250929",
		MaxTokens: 1024,
		Messages: []Message{
			{
				Role:    "user",
				Content: claudePrompt,
			},
		},
		Tools: tools,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Claude API error: %s - %s", resp.Status, string(body))
	}

	var claudeResp ClaudeResponse
	if err := json.Unmarshal(body, &claudeResp); err != nil {
		return nil, err
	}

	if len(claudeResp.Content) == 0 {
		return nil, fmt.Errorf("empty response from Claude API")
	}

	// Log response structure to see if web search was used
	log.Printf("Claude returned %d content blocks", len(claudeResp.Content))
	for i, block := range claudeResp.Content {
		log.Printf("Block %d: type=%s", i, block.Type)
	}

	// Extract text from all content blocks (may include tool use results)
	var text string
	for _, block := range claudeResp.Content {
		if block.Type == "text" && block.Text != "" {
			text += block.Text
		}
	}

	if text == "" {
		return nil, fmt.Errorf("no text content in Claude API response")
	}

	log.Printf("Claude response text: %q", text)

	// Clean up any preamble or explanation text
	text = cleanResponseText(text)
	log.Printf("Cleaned text: %q", text)

	// Parse the comma-separated response
	return parseCommaSeparatedList(text), nil
}
