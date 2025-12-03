# Documentation

This folder contains comprehensive guides for developing the Arzkaro iOS app with Expo.

## 📚 Available Guides

### 1. [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) - **START HERE!**
**Your daily development guide**

- ⚡ Quick start commands
- 🔄 When to rebuild vs when to just reload
- 🛠️ Common development commands
- 🐛 Troubleshooting guide
- ⌨️ Keyboard shortcuts and tips

**Perfect for:**
- Daily development
- Quick reference
- Common issues
- Understanding Fast Refresh

### 2. [planios.md](./planios.md) - **Deep Dive**
**Complete EAS build reference**

- 📦 Prerequisites and setup
- ⚙️ Configuration details
- 🏗️ EAS local builds
- 📱 iOS simulator setup
- 🔧 Advanced troubleshooting

**Perfect for:**
- Initial setup
- Understanding EAS builds
- Production builds
- Configuration reference

## 🚀 Quick Start for New Developers

1. **First time setup?** 
   - Read: [DEVELOPMENT_WORKFLOW.md - Project Setup](./DEVELOPMENT_WORKFLOW.md#project-setup-one-time)
   
2. **Daily development?**
   - Reference: [DEVELOPMENT_WORKFLOW.md - Daily Development Workflow](./DEVELOPMENT_WORKFLOW.md#daily-development-workflow)

3. **Hit an error?**
   - Check: [DEVELOPMENT_WORKFLOW.md - Troubleshooting](./DEVELOPMENT_WORKFLOW.md#troubleshooting-common-issues)

4. **Need to configure builds?**
   - See: [planios.md - Configuration](./planios.md#configuration)

## 🎯 Common Tasks

| Task | Guide | Section |
|------|-------|---------|
| Run app for first time | DEVELOPMENT_WORKFLOW.md | Quick Start |
| Daily coding workflow | DEVELOPMENT_WORKFLOW.md | Daily Development Workflow |
| Install new package | DEVELOPMENT_WORKFLOW.md | Scenario 2 |
| Fix "No servers found" | DEVELOPMENT_WORKFLOW.md | Troubleshooting Issue 1 |
| Configure EAS builds | planios.md | Configuration |
| Build for production | planios.md | Building Locally |
| Switch simulators | DEVELOPMENT_WORKFLOW.md | Scenario 4 |
| Clear caches | DEVELOPMENT_WORKFLOW.md | Troubleshooting Issue 4 |

## 💡 Key Concepts

### Fast Refresh (Hot Reload)
Most code changes reload automatically without rebuilding. No need to rebuild the app every time!

### When to Rebuild
- Installing native packages
- Changing app.json
- Modifying build configuration

See: [When to Rebuild vs When to Just Reload](./DEVELOPMENT_WORKFLOW.md#when-to-rebuild-vs-when-to-just-reload)

### Build Types
- **Development Build** (`pnpm run ios`) - Daily development
- **EAS Local Build** - Testing production builds
- **Production Build** - App Store release

See: [Understanding Build Types](./DEVELOPMENT_WORKFLOW.md#understanding-build-types)

## 🆘 Need Help?

1. Check [DEVELOPMENT_WORKFLOW.md - Troubleshooting](./DEVELOPMENT_WORKFLOW.md#troubleshooting-common-issues)
2. Review [planios.md - Troubleshooting](./planios.md#troubleshooting)
3. Check the [Expo Forums](https://forums.expo.dev/)
4. Join [Expo Discord](https://chat.expo.dev/)

## 📝 Contributing

Found an issue or have improvements? Update the docs and submit a PR!

---

**Last Updated:** December 2025
