[CmdletBinding()]
param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$taskUrl = 'http://localhost:8080/'
$taskPortalHealth = 'http://127.0.0.1:8080/health'
$taskWorkbenchHealth = 'http://127.0.0.1:8091/health'
$taskCompose = Join-Path $PSScriptRoot 'compose.yaml'
$taskLog = Join-Path $PSScriptRoot 'launcher.log'
$taskTranscript = $false

function Invoke-SeafDocker {
    param([string[]]$TaskArguments)
    $taskPreviousPreference = $ErrorActionPreference
    try {
        # Docker writes normal progress to stderr, including on success.
        $ErrorActionPreference = 'Continue'
        $taskLines = @(& $script:taskDocker @TaskArguments 2>&1)
        $taskCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $taskPreviousPreference
    }
    [pscustomobject]@{
        ExitCode = $taskCode
        Output = (($taskLines | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine)
    }
}

function Test-SeafDocker {
    $taskInfo = Invoke-SeafDocker -TaskArguments @('info', '--format', '{{.OSType}}')
    if ($taskInfo.ExitCode -eq 0 -and $taskInfo.Output.Trim() -eq 'windows') {
        throw 'Docker работает в режиме Windows containers. Переключите Docker Desktop на Linux containers.'
    }
    return ($taskInfo.ExitCode -eq 0 -and $taskInfo.Output.Trim() -eq 'linux')
}

try {
    Start-Transcript -Path $taskLog -Append | Out-Null
    $taskTranscript = $true
    Set-Location $PSScriptRoot
    Write-Host ('Запуск SEAF: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
    $taskCandidates = @(
        'C:\Program Files\Docker\Docker\resources\bin\docker.exe',
        "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin\docker.exe"
    )
    $taskCommand = Get-Command docker.exe -ErrorAction SilentlyContinue
    if ($taskCommand) { $taskCandidates += $taskCommand.Source }
    $script:taskDocker = $taskCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if (-not $script:taskDocker) { throw 'Docker Desktop не установлен.' }
    if (-not (Test-Path -LiteralPath $taskCompose)) { throw 'Не найден compose.yaml рядом со скриптом запуска.' }

    if (-not (Test-SeafDocker)) {
        Write-Host 'Запускается Docker Desktop...'
        $taskStart = Invoke-SeafDocker -TaskArguments @('desktop', 'start', '--detach')
        Write-Host $taskStart.Output
        if ($taskStart.ExitCode -ne 0) { throw 'Не удалось запустить Docker Desktop. Откройте его и проверьте сообщения.' }
        $taskDeadline = (Get-Date).AddMinutes(3)
        while (-not (Test-SeafDocker)) {
            if ((Get-Date) -gt $taskDeadline) { throw 'Docker не готов за 3 минуты. Проверьте окно Docker Desktop.' }
            Start-Sleep -Seconds 3
        }
    }

    Write-Host 'Запускается сервер SEAF...'
    $taskUp = Invoke-SeafDocker -TaskArguments @('compose', '-f', $taskCompose, 'up', '-d')
    Write-Host $taskUp.Output
    if ($taskUp.ExitCode -ne 0) { throw ('Не удалось запустить контейнер SEAF: ' + $taskUp.Output) }

    $taskReady = $false
    $taskDeadline = (Get-Date).AddMinutes(2)
    do {
        try {
            $taskHealth = Invoke-RestMethod -Uri $taskPortalHealth -TimeoutSec 5
            $taskReady = ($taskHealth.message -eq 'app is alive')
        } catch { $taskReady = $false }
        if (-not $taskReady) { Start-Sleep -Seconds 2 }
    } while (-not $taskReady -and (Get-Date) -lt $taskDeadline)
    if (-not $taskReady) { throw 'Сервер SEAF не подтвердил готовность. Проверьте журнал контейнера seaf-archtool.' }

    $taskWorkbenchReady = $false
    try { $taskWorkbenchReady = ((Invoke-RestMethod -Uri $taskWorkbenchHealth -TimeoutSec 3).service -eq 'seaf-workbench') } catch {}
    if (-not $taskWorkbenchReady) {
        $taskNode = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
        if (-not $taskNode) {
            $taskRuntimeNodes = @(Get-ChildItem -Path 'C:\Program Files\WindowsApps\OpenAI.CodexPrimaryRuntime.*\dependencies\node\bin\node.exe' -ErrorAction SilentlyContinue | Sort-Object FullName -Descending)
            if ($taskRuntimeNodes.Count) { $taskNode = $taskRuntimeNodes[0].FullName }
        }
        if (-not $taskNode) { throw 'Node.js 22+ required for SEAF Workbench. Install Node.js or repair the Codex runtime.' }
        $taskWorkbenchRoot = Join-Path (Split-Path $PSScriptRoot -Parent) 'seaf-mcp'
        $taskWorkbenchScript = Join-Path $taskWorkbenchRoot 'workbench\server.mjs'
        Start-Process -FilePath $taskNode -ArgumentList @('"' + $taskWorkbenchScript + '"') -WorkingDirectory $taskWorkbenchRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'workbench.log') -RedirectStandardError (Join-Path $PSScriptRoot 'workbench-error.log') | Out-Null
        $taskDeadline = (Get-Date).AddSeconds(20)
        do {
            try { $taskWorkbenchReady = ((Invoke-RestMethod -Uri $taskWorkbenchHealth -TimeoutSec 3).service -eq 'seaf-workbench') } catch {}
            if (-not $taskWorkbenchReady) { Start-Sleep -Milliseconds 500 }
        } while (-not $taskWorkbenchReady -and (Get-Date) -lt $taskDeadline)
        if (-not $taskWorkbenchReady) { throw 'SEAF Workbench did not start. See workbench-error.log.' }
    }
    Write-Host ('SEAF готов: ' + $taskUrl)
    if (-not $NoBrowser) { Start-Process -FilePath $taskUrl }
} catch {
    $taskMessage = $_.Exception.Message
    Write-Host ('Ошибка запуска SEAF: ' + $taskMessage)
    if (-not $NoBrowser) {
        try {
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.MessageBox]::Show(
                ($taskMessage + [Environment]::NewLine + [Environment]::NewLine + 'Журнал: ' + $taskLog),
                'Запуск SEAF.ArchTool',
                [System.Windows.Forms.MessageBoxButtons]::OK,
                [System.Windows.Forms.MessageBoxIcon]::Error
            ) | Out-Null
        } catch {}
    }
    exit 1
} finally {
    if ($taskTranscript) { Stop-Transcript | Out-Null }
}
