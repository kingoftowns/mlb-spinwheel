{{- define "spinwheel-backend.fullname" -}}
{{- .Chart.Name -}}
{{- end -}}

{{- define "spinwheel-backend.labels" -}}
app.kubernetes.io/name: {{ include "spinwheel-backend.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "spinwheel-backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "spinwheel-backend.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
