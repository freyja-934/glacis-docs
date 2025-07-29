---
id: prerequisites
title: Prerequisites
sidebar_label: Prerequisites
---

# Prerequisites

Before you can start using Sol-Airlift, you'll need to set up your development environment with the necessary tools and dependencies.

## Required Software

### 1. Solana CLI

Sol-Airlift requires Solana CLI version 1.18.0 or higher.

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Verify installation
solana --version

# Set cluster (devnet for testing, mainnet-beta for production)
solana config set --url https://api.devnet.solana.com
```

### 2. Anchor Framework

Sol-Airlift is built with Anchor framework version 0.30.1.

```bash
# Install Anchor via Anchor Version Manager (AVM)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1

# Verify installation
anchor --version
```

### 3. Node.js and Package Managers

Required versions:
- Node.js: v18.0.0 or higher
- pnpm: v8.0.0 or higher (recommended) or npm/yarn

```bash
# Install Node.js (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install pnpm
npm install -g pnpm

# Verify installations
node --version
pnpm --version
```

### 4. Rust

Anchor requires Rust to be installed:

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Update to latest version
rustup update

# Verify installation
rustc --version
cargo --version
```

## Wallet Setup

### 1. Create a Development Wallet

```bash
# Generate a new keypair for development
solana-keygen new --outfile ~/.config/solana/dev-wallet.json

# Set as default keypair
solana config set --keypair ~/.config/solana/dev-wallet.json

# Get your wallet address
solana address
```

### 2. Fund Your Wallet

For devnet testing:

```bash
# Airdrop SOL on devnet (can request up to 2 SOL at a time)
solana airdrop 2

# Check balance
solana balance
```

For mainnet, you'll need to acquire SOL through an exchange or faucet.

### 3. Browser Wallet (Optional)

For frontend testing, install one of these wallets:
- [Phantom](https://phantom.app/)
- [Solflare](https://solflare.com/)
- [Backpack](https://backpack.app/)

## RPC Node Access

### Recommended RPC Providers

For production use, we recommend using a dedicated RPC provider:

1. **Helius** (Recommended)
   ```typescript
   const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY";
   ```

2. **QuickNode**
   ```typescript
   const RPC_URL = "https://YOUR-ENDPOINT.solana-mainnet.quiknode.pro/YOUR-API-KEY/";
   ```

3. **Alchemy**
   ```typescript
   const RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/YOUR-API-KEY";
   ```

### Rate Limiting Considerations

When using public RPC endpoints, be aware of rate limits:
- Devnet: ~10 requests per second
- Mainnet public: ~2 requests per second
- Private RPC: Varies by provider (typically 50-100+ RPS)

## Environment Variables

Create a `.env` file in your project root:

```bash
# Network Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet

# Wallet Configuration
ANCHOR_WALLET=~/.config/solana/dev-wallet.json
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com

# Program IDs (update after deployment)
AIRLIFT_PROGRAM_ID=your_program_id_here

# API Keys (for mainnet)
HELIUS_API_KEY=your_helius_api_key
```

## Development Tools

### Recommended VS Code Extensions

- **Rust Analyzer**: For Rust/Anchor development
- **Solidity**: For viewing Solidity bridge contracts
- **Better TOML**: For Anchor.toml files
- **ESLint**: For TypeScript/JavaScript linting

### Useful Development Tools

1. **Solana Explorer**
   - Devnet: https://explorer.solana.com/?cluster=devnet
   - Mainnet: https://explorer.solana.com/

2. **Anchor IDL Viewer**
   - View and interact with deployed programs

3. **Solana Playground**
   - https://beta.solpg.io/
   - Online IDE for quick testing

## System Requirements

### Minimum Requirements

- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 20GB free space
- **OS**: macOS, Linux, or WSL2 on Windows

### Recommended Specifications

- **CPU**: 8+ cores
- **RAM**: 16GB+
- **Storage**: 50GB+ free space (for local validator)
- **Network**: Stable internet connection

## Verifying Your Setup

Run this script to verify all prerequisites are installed:

```bash
#!/bin/bash
echo "Checking prerequisites..."

# Check Solana
if command -v solana &> /dev/null; then
    echo "✅ Solana CLI: $(solana --version)"
else
    echo "❌ Solana CLI not found"
fi

# Check Anchor
if command -v anchor &> /dev/null; then
    echo "✅ Anchor: $(anchor --version)"
else
    echo "❌ Anchor not found"
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js not found"
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    echo "✅ pnpm: $(pnpm --version)"
else
    echo "❌ pnpm not found"
fi

# Check Rust
if command -v rustc &> /dev/null; then
    echo "✅ Rust: $(rustc --version)"
else
    echo "❌ Rust not found"
fi

# Check wallet
if [ -f ~/.config/solana/id.json ]; then
    echo "✅ Wallet configured"
else
    echo "❌ Wallet not configured"
fi
```

## Common Issues

### Issue: "Anchor build" fails

**Solution**: Ensure you're using the correct Anchor version:
```bash
avm use 0.30.1
anchor --version
```

### Issue: RPC rate limiting

**Solution**: Use a private RPC endpoint or implement retry logic:
```typescript
const connection = new Connection(RPC_URL, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
});
```

### Issue: Insufficient SOL for transactions

**Solution**: 
- On devnet: Request more airdrops
- On mainnet: Ensure wallet has at least 0.1 SOL for fees

## Next Steps

With all prerequisites installed, you're ready to:
1. [Install Sol-Airlift](./installation)
2. [Follow the Quick Start guide](./quick-start)
3. [Set up your environment](./environment-setup) 