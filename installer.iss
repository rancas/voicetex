[Setup]
AppId={{B5F92C2D-2D96-48F9-B935-3D0420CD5A7D}
AppName=VoiceTeX
AppVersion=1.0.0
AppPublisher=Luca Secchi
AppPublisherURL=https://github.com/rancas/voicetex
DefaultDirName={autopf}\VoiceTeX
DefaultGroupName=VoiceTeX
OutputBaseFilename=VoiceTeX-Setup
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=lowest
OutputDir=release

[Files]
Source: "backend-rust\target\x86_64-pc-windows-msvc\release\voicetex-backend.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "VoiceTeX.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\VoiceTeX"; Filename: "{app}\VoiceTeX.bat"; IconFilename: "{app}\voicetex-backend.exe"
Name: "{autodesktop}\VoiceTeX"; Filename: "{app}\VoiceTeX.bat"; IconFilename: "{app}\voicetex-backend.exe"
Name: "{group}\Uninstall VoiceTeX"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\VoiceTeX.bat"; Description: "Launch VoiceTeX"; Flags: nowait postinstall skipifsilent shellexec
