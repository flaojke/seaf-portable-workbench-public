param([Parameter(Mandatory=$true)][string]$Archive,[Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$seafArchivePath = (Resolve-Path -LiteralPath $Archive).ProviderPath
$seafDestinationPath = [IO.Path]::GetFullPath($Destination)
if (Test-Path -LiteralPath $seafDestinationPath) {
    if (@(Get-ChildItem -LiteralPath $seafDestinationPath -Force | Select-Object -First 1).Count) {
        throw 'Extraction destination must be empty; choose a fresh directory.'
    }
} else {
    [IO.Directory]::CreateDirectory($seafDestinationPath) | Out-Null
}
# Use the Windows .NET ZIP implementation directly. Expand-Archive adds costly
# PowerShell work for each entry in a distribution with tens of thousands of files.
[IO.Compression.ZipFile]::ExtractToDirectory($seafArchivePath, $seafDestinationPath)
