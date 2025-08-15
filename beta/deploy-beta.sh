#!/bin/bash

# Obsidian Card Viewer - Beta 部署脚本
# 用于本地打包并部署到 beta 仓库

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BETA_REPO_URL="git@github.com:vsme/obsidian-card-viewer-beta.git"
BETA_REPO_DIR="./temp-beta-repo"
BUILD_DIR="./temp-build"

# 函数：打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 函数：清理临时文件
cleanup() {
    print_info "清理临时文件..."
    # 只清理构建目录，保留 beta 仓库以便下次复用
    rm -rf "$BUILD_DIR"
    # 如果需要完全清理，取消注释下面这行
    # rm -rf "$BETA_REPO_DIR"
}

# 函数：检查依赖
check_dependencies() {
    print_info "检查依赖..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git 未安装或不在 PATH 中"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm 未安装或不在 PATH 中"
        exit 1
    fi
    
    print_success "依赖检查通过"
}

# 函数：构建项目
build_project() {
    print_info "开始构建项目..."
    
    # 安装依赖
    print_info "安装依赖..."
    pnpm install --frozen-lockfile
    
    # 构建项目
    print_info "构建项目..."
    pnpm build
    
    # 验证构建文件
    if [ ! -f "main.js" ]; then
        print_error "构建失败：main.js 文件不存在"
        exit 1
    fi
    
    if [ ! -f "manifest.json" ]; then
        print_error "构建失败：manifest.json 文件不存在"
        exit 1
    fi
    
    print_success "项目构建完成"
}

# 函数：准备部署文件
prepare_files() {
    print_info "准备部署文件..."
    
    # 创建构建目录
    mkdir -p "$BUILD_DIR"
    
    # 复制文件
    cp README.md "$BUILD_DIR/"
    cp main.js "$BUILD_DIR/"
    cp manifest.json "$BUILD_DIR/"
    
    # 复制 styles.css（如果存在）
    if [ -f "styles.css" ]; then
        cp styles.css "$BUILD_DIR/"
        print_info "已复制 styles.css"
    else
        print_warning "styles.css 不存在，跳过"
    fi
    
    # 复制 .github/workflows 目录（如果存在）
    if [ -f "beta/release.yml" ]; then
        mkdir -p "$BUILD_DIR/.github/workflows"
        cp beta/release.yml "$BUILD_DIR/.github/workflows/"
        print_info "已复制 GitHub Actions workflow"
    else
        print_warning "beta/release.yml 不存在，跳过"
    fi
    
    print_success "文件准备完成"
    ls -la "$BUILD_DIR"
}

# 函数：准备 beta 仓库
clone_beta_repo() {
    if [ -d "$BETA_REPO_DIR/.git" ]; then
        print_info "beta 仓库已存在，更新仓库..."
        cd "$BETA_REPO_DIR"
        
        # 检查是否是正确的仓库
        CURRENT_URL=$(git remote get-url origin 2>/dev/null || echo "")
        if [ "$CURRENT_URL" != "$BETA_REPO_URL" ]; then
            print_warning "仓库 URL 不匹配，重新克隆..."
            cd ..
            rm -rf "$BETA_REPO_DIR"
        else
            # 更新仓库
            git fetch origin
            git reset --hard origin/main
            cd ..
            print_success "beta 仓库更新完成"
            return
        fi
    fi
    
    print_info "克隆 beta 仓库..."
    git clone "$BETA_REPO_URL" "$BETA_REPO_DIR"
    
    if [ ! -d "$BETA_REPO_DIR" ]; then
        print_error "克隆 beta 仓库失败"
        exit 1
    fi
    
    print_success "beta 仓库克隆完成"
}

# 函数：部署到 beta 仓库
deploy_to_beta() {
    print_info "部署到 beta 仓库..."
    
    cd "$BETA_REPO_DIR"
    
    # 配置 git（如果需要）
    git config user.name "Local Deploy Script" 2>/dev/null || true
    git config user.email "deploy@local" 2>/dev/null || true
    
    # 清理工作区（保留 .git，使用 git 方式）
    git reset --hard HEAD 2>/dev/null || true
    git clean -fd
    
    # 复制新文件（包括隐藏文件）
    cp -r "../$BUILD_DIR"/. .
    
    # 添加所有文件（包括删除的文件）
    git add -A
    
    # 获取版本信息
    VERSION=$(date +"%Y%m%d-%H%M%S")
    TAG_VERSION=""
    if [ -f "../manifest.json" ]; then
        TAG_VERSION=$(grep '"version"' ../manifest.json | sed 's/.*"version":[[:space:]]*"\([^"]*\)".*/\1/')
        if [ -n "$TAG_VERSION" ]; then
            VERSION="$TAG_VERSION-$(date +"%Y%m%d-%H%M%S")"
        fi
    fi
    
    # 检查是否有变更
    if git diff --staged --quiet; then
        print_warning "没有文件变更，跳过提交"
        # 即使没有文件变更，也要处理 tag
        if [ -n "$TAG_VERSION" ]; then
            print_info "检查并创建 tag: $TAG_VERSION"
            git tag "$TAG_VERSION" 2>/dev/null || {
                print_warning "Tag $TAG_VERSION 已存在，删除旧 tag"
                git tag -d "$TAG_VERSION" 2>/dev/null || true
                git push origin --delete "$TAG_VERSION" 2>/dev/null || true
                git tag "$TAG_VERSION"
            }
            print_info "推送 tag: $TAG_VERSION"
            git push origin "$TAG_VERSION"
            print_success "Tag $TAG_VERSION 已推送"
        fi
        cd ..
        return
    fi
    
    # 提交变更
    git commit -m "Deploy plugin files for $VERSION

- Updated from local build
- Build time: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
- Files: README.md, main.js, manifest.json$([ -f styles.css ] && echo ", styles.css" || echo "")"
    
    # 创建并推送 tag
    if [ -n "$TAG_VERSION" ]; then
        print_info "创建 tag: $TAG_VERSION"
        git tag "$TAG_VERSION" 2>/dev/null || {
            print_warning "Tag $TAG_VERSION 已存在，删除旧 tag"
            git tag -d "$TAG_VERSION" 2>/dev/null || true
            git push origin --delete "$TAG_VERSION" 2>/dev/null || true
            git tag "$TAG_VERSION"
        }
    fi
    
    # 推送到远程仓库
    print_info "推送到远程仓库..."
    git push origin main
    
    # 推送 tag
    if [ -n "$TAG_VERSION" ]; then
        print_info "推送 tag: $TAG_VERSION"
        git push origin "$TAG_VERSION"
        print_success "Tag $TAG_VERSION 已推送"
    fi
    
    cd ..
    print_success "部署完成！"
}

# 主函数
main() {
    print_info "开始 Obsidian Card Viewer Beta 部署"
    print_info "目标仓库: $BETA_REPO_URL"
    echo
    
    # 设置错误处理
    trap cleanup EXIT
    
    # 执行部署步骤
    # check_dependencies
    build_project
    prepare_files
    clone_beta_repo
    deploy_to_beta
    
    print_success "🎉 Beta 部署成功完成！"
    print_info "你可以在以下地址查看部署结果："
    print_info "https://github.com/vsme/obsidian-card-viewer-beta"
}

# 检查参数
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Obsidian Card Viewer - Beta 部署脚本"
    echo
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  --dry-run      仅构建，不部署"
    echo
    echo "此脚本将:"
    echo "1. 安装依赖并构建项目"
    echo "2. 克隆 beta 仓库"
    echo "3. 复制构建文件到 beta 仓库"
    echo "4. 提交并推送变更"
    echo
    echo "前提条件:"
    echo "- 已安装 git 和 pnpm"
    echo "- 已配置 SSH 密钥访问 GitHub"
    echo "- 对 beta 仓库有写入权限"
    exit 0
fi

if [ "$1" = "--dry-run" ]; then
    print_info "执行 dry-run 模式（仅构建，不部署）"
    check_dependencies
    build_project
    prepare_files
    print_success "Dry-run 完成！构建文件位于: $BUILD_DIR"
    print_info "注意：构建文件未被清理，请手动删除 $BUILD_DIR 目录"
    exit 0
fi

# 执行主函数
main