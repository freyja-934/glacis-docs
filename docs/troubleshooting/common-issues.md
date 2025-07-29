---
id: common-issues
title: Common Issues & Solutions
sidebar_label: Common Issues
---

# Common Issues & Solutions

This guide covers common issues encountered when using Sol-Airlift and their solutions.

## Transaction Issues

### "Transaction too large"

**Symptoms:**
- Error: `Transaction too large: 1289 > 1232 bytes`
- Transfer fails with size error

**Solutions:**

1. **Use Address Lookup Tables (LUTs)**:
   ```bash
   # Create token-specific LUT
   ts-node scripts/create-lut.ts --token YOUR_TOKEN --type oft
   
   # For destination-specific transfers
   ts-node scripts/create-custom-lut.ts \
     --token YOUR_TOKEN \
     --destination ethereum
   ```

2. **Remove ComputeBudget instruction**:
   ```typescript
   // If using SDK, disable compute budget
   const tx = await client.sendWithoutComputeBudget(...);
   ```

3. **Use versioned transactions**:
   ```typescript
   const tx = new VersionedTransaction(
     new TransactionMessage({
       payerKey: payer.publicKey,
       recentBlockhash: blockhash,
       instructions,
     }).compileToV0Message([lut])
   );
   ```

### "Insufficient SOL for fees"

**Symptoms:**
- Error: `Insufficient funds for rent`
- Transaction fails before execution

**Solutions:**

```bash
# Check balance
solana balance

# Airdrop on devnet
solana airdrop 2

# Calculate required SOL
ts-node scripts/calculate-fees.ts \
  --token YOUR_TOKEN \
  --amount 100 \
  --destination ethereum
```

### "Invalid instruction"

**Symptoms:**
- Error: `InvalidInstruction`
- Bridge instruction validation fails

**Solutions:**

1. **Verify token registration**:
   ```bash
   ts-node scripts/verify-token.ts --token YOUR_TOKEN
   ```

2. **Check instruction order**:
   - Bridge instructions must be in the same transaction
   - Airlift instruction must come after bridge setup

3. **Update SDK version**:
   ```bash
   npm update airlift-solana-sdk
   ```

## Quote Issues

### "Quote failed"

**Symptoms:**
- Cannot get quote from bridge
- Empty quote response

**Solutions:**

1. **Check bridge endpoints**:
   ```bash
   # Test LayerZero endpoint
   ts-node scripts/test-lz-endpoint.ts
   
   # Test Wormhole endpoint
   ts-node scripts/test-wh-endpoint.ts
   ```

2. **Verify token configuration**:
   ```typescript
   // Check NTT config
   const config = await client.getTokenConfig(mint);
   console.log("Manager:", config.manager);
   console.log("Transceiver:", config.transceiver);
   ```

3. **Check destination chain support**:
   ```bash
   # List supported chains for token
   ts-node scripts/list-token-chains.ts --token YOUR_TOKEN
   ```

### "Invalid fee configuration"

**Symptoms:**
- Quote includes unexpected fees
- Fee calculation errors

**Solutions:**

```bash
# Check current fee config
ts-node scripts/check-token-fee.ts --token YOUR_TOKEN

# Reset to default fees
ts-node scripts/reset-token-fee.ts --token YOUR_TOKEN

# Set specific fees
ts-node scripts/set-token-fee.ts \
  --token YOUR_TOKEN \
  --native-fee 0.001 \
  --token-fee 20 \
  --type bps
```

## Token Configuration Issues

### "Token not found"

**Symptoms:**
- Error: `Token configuration not found`
- Cannot perform transfers

**Solutions:**

1. **Register token**:
   ```bash
   ts-node scripts/add-token-config.ts \
     --config ../config/tokens/YOUR_TOKEN.json \
     --type ntt|oft
   ```

2. **Verify registration**:
   ```bash
   ts-node scripts/list-tokens.ts | grep YOUR_TOKEN
   ```

### "Invalid token authority"

**Symptoms:**
- NTT token authority mismatch
- Cannot burn/mint tokens

**Solutions:**

```typescript
// Verify NTT authority
const manager = await nttProgram.account.manager.fetch(managerAddress);
console.log("Expected authority:", manager.tokenAuthority);
console.log("Token authority:", tokenAccount.authority);

// Update if needed (admin only)
await updateTokenAuthority(mint, correctAuthority);
```

## LUT Issues

### "LUT not found"

**Symptoms:**
- Error: `Address lookup table not found`
- Transaction fails to compile

**Solutions:**

1. **Create missing LUT**:
   ```bash
   # Basic LUT
   ts-node scripts/create-lut.ts --token YOUR_TOKEN
   
   # With specific accounts
   ts-node scripts/create-custom-lut.ts \
     --token YOUR_TOKEN \
     --accounts account1,account2,account3
   ```

2. **Verify LUT activation**:
   ```typescript
   // LUTs need one slot to activate
   const lut = await connection.getAddressLookupTable(lutAddress);
   if (!lut.value) {
     console.log("LUT not yet active, wait one slot");
   }
   ```

### "LUT account limit exceeded"

**Symptoms:**
- Cannot add more accounts to LUT
- LUT creation fails

**Solutions:**

```bash
# Create multiple LUTs
ts-node scripts/create-multi-lut.ts \
  --token YOUR_TOKEN \
  --type oft \
  --split 3

# Use in transaction
const tx = new VersionedTransaction(
  message.compileToV0Message([lut1, lut2, lut3])
);
```

## Bridge-Specific Issues

### LayerZero Issues

**"Endpoint paused"**:
```typescript
// Check endpoint status
const isPaused = await lzEndpoint.isPaused();
if (isPaused) {
  console.log("LayerZero endpoint is paused");
}
```

**"Invalid destination"**:
```bash
# Verify endpoint ID
ts-node scripts/verify-lz-endpoint.ts --chain ethereum
# Expected: 30101
```

### Wormhole Issues

**"VAA not found"**:
```typescript
// Wait for VAA availability
const vaa = await waitForVAA(
  wormholeRPC,
  emitterChain,
  emitterAddress,
  sequence,
  { retries: 5, delay: 5000 }
);
```

**"Guardian set mismatch"**:
```bash
# Update guardian set
ts-node scripts/update-guardian-set.ts
```

## Performance Issues

### Slow Transactions

**Solutions:**

1. **Use priority fees**:
   ```typescript
   const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
     units: 400_000,
   });
   
   const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
     microLamports: 1_000,
   });
   ```

2. **Optimize account ordering**:
   ```typescript
   // Put writable accounts first
   const sortedAccounts = accounts.sort((a, b) => 
     b.isWritable - a.isWritable
   );
   ```

### RPC Limitations

**Solutions:**

```typescript
// Use dedicated RPC
const connection = new Connection(
  "https://your-dedicated-rpc.com",
  {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60000,
  }
);

// Implement retry logic
const tx = await retryTransaction(
  connection,
  transaction,
  { maxRetries: 3, delay: 1000 }
);
```

## Debugging Tools

### Transaction Analysis

```bash
# Analyze failed transaction
ts-node scripts/analyze-tx.ts --signature TX_SIGNATURE

# Decode transaction
ts-node scripts/decode-tx.ts --tx BASE64_TX

# Simulate transaction
ts-node scripts/simulate-tx.ts --file tx.json
```

### State Inspection

```typescript
// Check program state
const globalConfig = await program.account.globalConfig.fetch(globalConfigPDA);
console.log("Admin:", globalConfig.admin.toString());
console.log("Fee recipient:", globalConfig.feeRecipient.toString());

// Check token state
const tokenConfig = await program.account.tokenConfig.fetch(tokenConfigPDA);
console.log("Token type:", tokenConfig.tokenType);
console.log("Program ID:", tokenConfig.programId.toString());
```

### Logging

```typescript
// Enable debug logging
process.env.DEBUG = "airlift:*";

// Custom logger
const logger = {
  info: (msg: string, data?: any) => {
    console.log(`[INFO] ${msg}`, data || "");
  },
  error: (msg: string, err?: any) => {
    console.error(`[ERROR] ${msg}`, err || "");
  },
};

client.setLogger(logger);
```

## Recovery Procedures

### Stuck Transactions

```bash
# Cancel stuck transaction
solana transfer --from YOUR_KEYPAIR \
  --to YOUR_KEYPAIR \
  --lamports 0 \
  --blockhash RECENT_BLOCKHASH

# Drop transaction from local cache
rm -rf ~/.cache/solana/transaction-cache
```

### Failed Transfers

```typescript
// Retry with higher priority
const retryTransfer = async (originalTx: Transaction) => {
  const newTx = Transaction.from(originalTx.serialize());
  
  // Add priority fee
  newTx.add(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 10_000,
    })
  );
  
  return await sendAndConfirmTransaction(connection, newTx, signers);
};
```

## Best Practices

1. **Always use LUTs** for cross-chain transfers
2. **Test on devnet** before mainnet
3. **Monitor gas prices** on destination chains
4. **Keep SDKs updated** to latest versions
5. **Implement retry logic** for network issues
6. **Use dedicated RPCs** for production

## Getting Help

If issues persist:

1. **Check logs**:
   ```bash
   solana logs --url mainnet-beta | grep YOUR_PROGRAM_ID
   ```

2. **Join Discord**: Get real-time help from the community

3. **Create issue**: Report bugs on [GitHub](https://github.com/glacislabs/sol-airlift)

4. **Contact support**: support@glacislabs.com for critical issues 