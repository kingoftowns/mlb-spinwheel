{{- define "spinwheel-frontend.fullname" -}}
{{- .Chart.Name -}}
{{- end -}}

{{- define "spinwheel-frontend.labels" -}}
app.kubernetes.io/name: {{ include "spinwheel-frontend.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "spinwheel-frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "spinwheel-frontend.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
