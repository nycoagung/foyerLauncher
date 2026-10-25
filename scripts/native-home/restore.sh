set -eu
printf 'FOYER_HOME_INSPECT_BEGIN\n'
/usr/bin/dotnet /home/owner/share/tmp/sdk_tools/FoyerHomeControl.dll restore /home/owner/share/tmp/sdk_tools/FoyerHomeOriginal.json
printf 'FOYER_HOME_INSPECT_END\n'
