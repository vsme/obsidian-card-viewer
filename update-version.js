#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 更新版本号的脚本
 * 用法: node update-version.js <new_version> [--tag]
 * 例如: node update-version.js 1.0.4
 * 例如: node update-version.js 1.0.4 --tag (自动创建 git 标签)
 */

function updateVersion(newVersion, createTag = false) {
    // 验证版本号格式
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(newVersion)) {
        console.error('错误: 版本号格式不正确。请使用 x.y.z 格式 (例如: 1.0.4)');
        process.exit(1);
    }

    const packageJsonPath = path.join(__dirname, 'package.json');
    const manifestJsonPath = path.join(__dirname, 'manifest.json');

    try {
        // 更新 package.json
        console.log('正在更新 package.json...');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const oldPackageVersion = packageJson.version;
        packageJson.version = newVersion;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log(`✓ package.json 版本已从 ${oldPackageVersion} 更新到 ${newVersion}`);

        // 更新 manifest.json
        console.log('正在更新 manifest.json...');
        const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
        const oldManifestVersion = manifestJson.version;
        manifestJson.version = newVersion;
        fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, '\t'));
        console.log(`✓ manifest.json 版本已从 ${oldManifestVersion} 更新到 ${newVersion}`);

        console.log('\n版本更新完成! 🎉');
        
        if (createTag) {
            try {
                console.log('\n正在创建 git 标签...');
                execSync(`git add .`, { stdio: 'inherit' });
                execSync(`git commit -m "Update version to ${newVersion}"`, { stdio: 'inherit' });
                execSync(`git tag ${newVersion}`, { stdio: 'inherit' });
                console.log(`✓ 已创建标签 ${newVersion}`);

                console.log('\n建议的后续步骤:');
                console.log('./beta/deploy-beta.sh\ngit push && git push --tags');
            } catch (error) {
                console.error('\n创建标签时出错:', error.message);
                console.log('\n建议的后续步骤:');
                console.log('1. git add package.json manifest.json');
                console.log(`2. git commit -m "Update version to ${newVersion}"`);
                console.log(`3. git tag ${newVersion}`);
                console.log('4. git push && git push --tags');
            }
        } else {
            console.log('\n建议的后续步骤:');
            console.log('1. git add package.json manifest.json');
            console.log(`2. git commit -m "Update version to ${newVersion}"`);
            console.log(`3. git tag v${newVersion}`);
            console.log('4. git push && git push --tags');
            console.log('\n提示: 使用 --tag 参数可以自动创建 git 标签');
        }

    } catch (error) {
        console.error('错误:', error.message);
        process.exit(1);
    }
}

// 获取命令行参数
const args = process.argv.slice(2);
const newVersion = args[0];
const createTag = args.includes('--tag');

if (!newVersion) {
    console.error('错误: 请提供新的版本号');
    console.log('用法: node update-version.js <new_version> [--tag]');
    console.log('例如: node update-version.js 1.0.4');
    console.log('例如: node update-version.js 1.0.4 --tag (自动创建 git 标签)');
    process.exit(1);
}

updateVersion(newVersion, createTag);