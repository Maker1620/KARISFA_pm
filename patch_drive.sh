sed -i 's/export const saveProjectAsJsonBackup = async (folderId: string, state: NexusProjectState, token: string): Promise<string> => {/export const saveProjectAsJsonBackup = async (folderId: string, state: NexusProjectState, token: string, fileName: string = "Nexus_Backup.json"): Promise<string> => {/g' services/driveService.ts
sed -i "s/name='Nexus_Backup.json'/name='\" \+ fileName \+ \"'/g" services/driveService.ts
sed -i "s/name: 'Nexus_Backup.json'/name: fileName/g" services/driveService.ts
