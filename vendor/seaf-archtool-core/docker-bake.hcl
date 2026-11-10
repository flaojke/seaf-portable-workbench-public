# Принимаем из консоли список тегов (через запятую) и что билдим (full/backend/frontend).
# По умолчанию, если ничего не передали, тег назначается 'unknown', а билдится full образ (backend+frontend).
# Пример: TAGS='latest,версия.1,версия.2,...' TYPE='backend' docker buildx bake -f .docker/bake.hcl <target>
variable "tags" {
  type    = list(string)
  default = ["unknown"]
}

variable "type" {
  type    = string
  default = ""
}

target "base" {
  context = "."
  dockerfile = "Dockerfile"
  target = type
  args = merge(
    { GITVERSE = "true" },
  )
  no-cache = false
  attest = [
    "type=sbom,disabled=true"
  ]
}

target "docker_io" {
  inherits = ["base"]
  tags = [
    for t in tags : 
    type == "" ? "seaf/seaf-archtool-core:${t}" : "seaf/seaf-archtool-core:${t}-${type}"
  ]
}

target "gitverse_ru" {
  inherits = ["base"]
  tags = [
    for t in tags : 
    type == "" ? "gitverse.ru/seafteam/seaf-archtool-core:${t}" : "gitverse.ru/seafteam/seaf-archtool-core:${t}-${type}"
  ]
}
