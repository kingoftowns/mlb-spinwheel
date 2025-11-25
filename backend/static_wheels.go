package main

import (
	"log"
	"strings"
)

// TeamData represents a team with its identifier
type TeamData struct {
	Name       string
	Identifier string
}

// StaticWheel represents a predefined wheel configuration
type StaticWheel struct {
	ID    string
	Teams []TeamData
}

var staticWheels = []StaticWheel{
	{
		ID: "mlb",
		Teams: []TeamData{
			{"Seattle Mariners", "SEA"},
			{"San Francisco Giants", "SF"},
			{"Oakland Athletics", "OAK"},
			{"Los Angeles Dodgers", "LAD"},
			{"Los Angeles Angels", "LAA"},
			{"San Diego Padres", "SD"},
			{"Colorado Rockies", "COL"},
			{"Arizona Diamondbacks", "ARI"},
			{"Texas Rangers", "TEX"},
			{"Houston Astros", "HOU"},
			{"Minnesota Twins", "MIN"},
			{"Milwaukee Brewers", "MIL"},
			{"Kansas City Royals", "KC"},
			{"Chicago Cubs", "CHC"},
			{"Chicago White Sox", "CWS"},
			{"St. Louis Cardinals", "STL"},
			{"Detroit Tigers", "DET"},
			{"Cleveland Guardians", "CLE"},
			{"Cincinnati Reds", "CIN"},
			{"Pittsburgh Pirates", "PIT"},
			{"Toronto Blue Jays", "TOR"},
			{"Boston Red Sox", "BOS"},
			{"New York Yankees", "NYY"},
			{"New York Mets", "NYM"},
			{"Philadelphia Phillies", "PHI"},
			{"Baltimore Orioles", "BAL"},
			{"Washington Nationals", "WSH"},
			{"Atlanta Braves", "ATL"},
			{"Tampa Bay Rays", "TB"},
			{"Miami Marlins", "MIA"},
		},
	},
	{
		ID: "nba",
		Teams: []TeamData{
			{"Portland Trail Blazers", "POR"},
			{"Golden State Warriors", "GSW"},
			{"Sacramento Kings", "SAC"},
			{"Los Angeles Lakers", "LAL"},
			{"Los Angeles Clippers", "LAC"},
			{"Phoenix Suns", "PHX"},
			{"Utah Jazz", "UTA"},
			{"Denver Nuggets", "DEN"},
			{"Oklahoma City Thunder", "OKC"},
			{"Dallas Mavericks", "DAL"},
			{"San Antonio Spurs", "SAS"},
			{"Houston Rockets", "HOU"},
			{"Memphis Grizzlies", "MEM"},
			{"New Orleans Pelicans", "NOP"},
			{"Minnesota Timberwolves", "MIN"},
			{"Milwaukee Bucks", "MIL"},
			{"Chicago Bulls", "CHI"},
			{"Detroit Pistons", "DET"},
			{"Cleveland Cavaliers", "CLE"},
			{"Indiana Pacers", "IND"},
			{"Toronto Raptors", "TOR"},
			{"Boston Celtics", "BOS"},
			{"New York Knicks", "NYK"},
			{"Brooklyn Nets", "BKN"},
			{"Philadelphia 76ers", "PHI"},
			{"Washington Wizards", "WAS"},
			{"Charlotte Hornets", "CHA"},
			{"Atlanta Hawks", "ATL"},
			{"Orlando Magic", "ORL"},
			{"Miami Heat", "MIA"},
		},
	},
}

// getStaticWheel checks if the prompt matches a static wheel and returns its options
func getStaticWheel(prompt string) ([]string, []TeamData, string, bool) {
	normalizedPrompt := strings.ToLower(strings.TrimSpace(prompt))

	// Map of keywords to wheel IDs
	keywords := map[string]string{
		"mlb":                           "mlb",
		"mlb teams":                     "mlb",
		"baseball":                      "mlb",
		"baseball teams":                "mlb",
		"major league baseball":         "mlb",
		"nba":                           "nba",
		"nba teams":                     "nba",
		"basketball":                    "nba",
		"basketball teams":              "nba",
		"national basketball association": "nba",
	}

	wheelID, found := keywords[normalizedPrompt]
	if !found {
		return nil, nil, "", false
	}

	// Find the matching static wheel
	for _, wheel := range staticWheels {
		if wheel.ID == wheelID {
			options := make([]string, len(wheel.Teams))
			for i, team := range wheel.Teams {
				options[i] = team.Name
			}
			log.Printf("Using static wheel '%s' with %d options", wheelID, len(options))
			return options, wheel.Teams, wheelID, true
		}
	}

	return nil, nil, "", false
}
