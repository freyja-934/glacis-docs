---
id: environment-setup
title: Environment Setup
sidebar_label: Environment Setup
---

# Environment Setup

This guide covers setting up your development environment for Sol-Airlift across different networks.

## Network Configuration

### Available Networks

| Network | RPC Endpoint | Explorer | Use Case |
|---------|-------------|----------|----------|
| Devnet | `https://api.devnet.solana.com` | [Explorer](https://explorer.solana.com/?cluster=devnet) | Development & Testing |
| Testnet | `https://api.testnet.solana.com` | [Explorer](https://explorer.solana.com/?cluster=testnet) | Pre-production Testing |
| Mainnet | `https://api.mainnet-beta.solana.com` | [Explorer](https://explorer.solana.com/) | Production |

### Configure Solana CLI

```bash
# Set network
solana config set --url https://api.devnet.solana.com  # For devnet
solana config set --url https://api.mainnet-beta.solana.com  # For mainnet

# Verify configuration
solana config get
```

### RPC Providers

For production use, we recommend dedicated RPC providers:

#### Recommended Providers
- **Helius**: https://helius.xyz - Fast, reliable, good free tier
- **QuickNode**: https://quicknode.com - Enterprise features
- **Alchemy**: https://alchemy.com - Comprehensive developer tools
- **Triton**: https://triton.one - High performance

#### Configure Custom RPC
```bash
# Set custom RPC
solana config set --url https://your-rpc-endpoint.com

# For Anchor
export ANCHOR_PROVIDER_URL=https://your-rpc-endpoint.com
```

## Wallet Setup

### Generate Deployment Wallet

```bash
# Generate new keypair
solana-keygen new --outfile ~/sol-airlift-deployer.json

# Set as default
solana config set --keypair ~/sol-airlift-deployer.json

# Get address
solana address

# Check balance
solana balance
```

### Fund Your Wallet

```bash
# Devnet - Request airdrop
solana airdrop 2

# Mainnet - Transfer SOL from exchange or existing wallet
# Recommended: 5+ SOL for deployment and operations
```

## Project Configuration

### Update Anchor.toml

```toml
[features]
seeds = false
skip-lint = false

[programs.devnet]
airlift = "DEVNET_PROGRAM_ID"

[programs.mainnet]
airlift = "6as1nMXzpNhRG1jaJa3s7SXw3J6eQwG29qLfSwDj8vgx"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"  # or "mainnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### Environment Variables

Create `.env` file:

```bash
# Network
NETWORK=devnet  # or mainnet
RPC_ENDPOINT=https://api.devnet.solana.com

# Program IDs
PROGRAM_ID_DEVNET=YOUR_DEVNET_PROGRAM_ID
PROGRAM_ID_MAINNET=6as1nMXzpNhRG1jaJa3s7SXw3J6eQwG29qLfSwDj8vgx

# Wallets
DEPLOYER_KEYPAIR_PATH=~/sol-airlift-deployer.json
ADMIN_KEYPAIR_PATH=~/sol-airlift-admin.json

# Optional: Custom RPC
HELIUS_API_KEY=your-api-key
QUICKNODE_ENDPOINT=your-endpoint
```

### Load Environment

```typescript
import dotenv from 'dotenv';
dotenv.config();

const network = process.env.NETWORK || 'devnet';
const rpcEndpoint = process.env.RPC_ENDPOINT || 'https://api.devnet.solana.com';
const programId = network === 'mainnet' 
  ? process.env.PROGRAM_ID_MAINNET 
  : process.env.PROGRAM_ID_DEVNET;
```

## Security Best Practices

### Keypair Management

1. **Never commit keypairs to git**
   ```bash
   # Add to .gitignore
   *.json
   .env
   ```

2. **Use hardware wallets for mainnet**
   ```bash
   # Configure Ledger
   solana config set --keypair usb://ledger
   ```

3. **Separate keys by function**
   - Deployer: Only for program deployment
   - Admin: For configuration changes
   - Fee Recipient: For receiving fees
   - Operations: For routine tasks

### Access Control

```typescript
// Set up multisig for admin operations
const multisig = await createMultisig(
  connection,
  payer,
  [admin1, admin2, admin3],
  2 // threshold
);
```

## Mainnet Deployment

### Current Mainnet Program
- **Program ID**: `6as1nMXzpNhRG1jaJa3s7SXw3J6eQwG29qLfSwDj8vgx`
- **Upgrade Authority**: Secured by multisig

### Deployment Commands

```bash
# Check current program size
solana program show 6as1nMXzpNhRG1jaJa3s7SXw3J6eQwG29qLfSwDj8vgx -u m

# Deploy/upgrade using the redeploy script
./scripts/redeploy-mainnet.sh 456384  # Use size from above
```

For new deployments, see the [Quick Start Guide](./quick-start).

## Monitoring and Alerts

### Set Up Monitoring

```bash
# Monitor program logs
solana logs 6as1nMXzpNhRG1jaJa3s7SXw3J6eQwG29qLfSwDj8vgx -u m

# Watch specific transaction
solana confirm -v TX_SIGNATURE
```

### Health Checks

```typescript
// Regular health check script
async function checkProgramHealth() {
  const programInfo = await connection.getAccountInfo(programId);
  console.log('Program executable:', programInfo?.executable);
  console.log('Program size:', programInfo?.data.length);
  console.log('Program owner:', programInfo?.owner.toBase58());
}
```

## Troubleshooting

### Common Issues

**"Insufficient funds for transaction"**
- Check wallet balance: `solana balance`
- Ensure enough for transaction + rent
- Request devnet airdrop if needed

**"Program not found"**
- Verify correct network: `solana config get`
- Check program ID matches network
- Ensure program is deployed

**"Transaction too large"**
- Use Address Lookup Tables
- Reduce instruction complexity
- Split into multiple transactions

### Debug Commands

```bash
# Check cluster
solana cluster-version

# Test RPC connection
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
  YOUR_RPC_ENDPOINT

# Verify program deployment
solana program show PROGRAM_ID
```

## Next Steps

1. **Deploy to Devnet**: Follow the [Quick Start Guide](./quick-start)
2. **Configure Tokens**: Set up your first token transfers
3. **Production Checklist**: Review security before mainnet
4. **Monitor Operations**: Set up logging and alerts 