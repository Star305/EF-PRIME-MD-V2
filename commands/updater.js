const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'updater',
    description: 'Check for updates from the GitHub repo and update the bot system',
    permission: 2,
    cooldowns: 10,
    dmUser: true,
    run: async ({ sock, m, args }) => {
        const repoUrl = 'https://github.com/efkidgamerdev/EF-PRIME-MD-V2.git';
        const basePath = path.resolve(__dirname, '..');
        const tempDir = path.join(basePath, 'temp_update');
        
        await sock.sendMessage(m.key.remoteJid, { text: '🔄 Checking for updates...' });
        
        const checkAndUpdate = async () => {
            try {
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                
                await executeCommand(`git clone ${repoUrl} ${tempDir}`);
                
                const currentVersion = await getLocalVersion(basePath);
                const remoteVersion = await getRemoteVersion(tempDir);
                
                if (currentVersion !== remoteVersion) {
                    await sock.sendMessage(m.key.remoteJid, { 
                        text: `🆕 New update detected!\nCurrent version: ${currentVersion || 'Unknown'}\nRemote version: ${remoteVersion || 'Unknown'}\n\nStarting update process...` 
                    });
                    
                    const backupDir = path.join(basePath, 'backup_' + Date.now());
                    fs.mkdirSync(backupDir, { recursive: true });
                    await executeCommand(`cp -r ${basePath}/* ${backupDir}`);
                    
                    await updateFiles(tempDir, basePath);
                    
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    
                    await sock.sendMessage(m.key.remoteJid, { 
                        text: '✅ Update completed successfully! The system will restart in 5 seconds...' 
                    });
                    
                    setTimeout(() => {
                        process.exit(0);
                    }, 5000);
                    
                } else {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    await sock.sendMessage(m.key.remoteJid, { 
                        text: '✅ System is already up to date!' 
                    });
                }
            } catch (error) {
                fs.rmSync(tempDir, { recursive: true, force: true });
                await sock.sendMessage(m.key.remoteJid, { 
                    text: `❌ Update failed: ${error.message}` 
                });
            }
        };
        
        await checkAndUpdate();
    },
};

async function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
}

async function getLocalVersion(basePath) {
    try {
        const packagePath = path.join(basePath, 'package.json');
        if (fs.existsSync(packagePath)) {
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            return packageData.version;
        }
        
        const gitHash = await executeCommand('git rev-parse HEAD');
        return gitHash.trim();
    } catch (error) {
        return 'Unknown';
    }
}

async function getRemoteVersion(repoPath) {
    try {
        const packagePath = path.join(repoPath, 'package.json');
        if (fs.existsSync(packagePath)) {
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            return packageData.version;
        }
        
        const gitHash = await executeCommand(`cd ${repoPath} && git rev-parse HEAD`);
        return gitHash.trim();
    } catch (error) {
        return 'Unknown';
    }
}

async function updateFiles(sourcePath, destPath) {
    const excludes = [
        'node_modules',
        '.env',
        'config.json',
        'auth_info',
        'backup_'
    ];
    
    const getFilesRecursively = (dir, baseDir = '') => {
        let results = [];
        const list = fs.readdirSync(dir);
        
        for (const file of list) {
            if (excludes.some(excluded => file.includes(excluded))) {
                continue;
            }
            
            const fullPath = path.join(dir, file);
            const relativePath = path.join(baseDir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                results = results.concat(getFilesRecursively(fullPath, relativePath));
            } else {
                results.push(relativePath);
            }
        }
        
        return results;
    };
    
    const files = getFilesRecursively(sourcePath);
    
    for (const file of files) {
        const sourceFile = path.join(sourcePath, file);
        const destFile = path.join(destPath, file);
        
        const destDir = path.dirname(destFile);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.copyFileSync(sourceFile, destFile);
    }
}