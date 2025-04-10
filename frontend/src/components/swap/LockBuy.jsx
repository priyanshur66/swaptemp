import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBlockchain } from '@/lib/blockchain-context';

const LockBuy = () => {
  const [tokenAddress, setTokenAddress] = useState(''); // Default to USDT
  const [recipient, setRecipient] = useState('');
  const [secret, setSecret] = useState('');
  const [hashedSecret, setHashedSecret] = useState('');
  const [timeout, setTimeout] = useState(3600); // 1 hour in seconds
  const [value, setValue] = useState('10'); // Default amount in tokens
  const [rawTokenValue, setRawTokenValue] = useState('1000000'); // Default raw token value (1 USDT with 6 decimals)
  const [useRawValue, setUseRawValue] = useState(true); // Toggle for value format - default true for USDT
  const [sellAssetId, setSellAssetId] = useState('0x95b58483568979bea3b27def505f49beeda8b41a13274e3622c64e61d087a796'); // Default asset ID
  const [sellPrice, setSellPrice] = useState('10'); // Default price in tokens
  const [rawSellPrice, setRawSellPrice] = useState('1000000'); // Default raw sell price (1 USDT with 6 decimals)
  const [useRawSellPrice, setUseRawSellPrice] = useState(true); // Toggle for price format - default true for USDT
  const [loading, setLoading] = useState(false);

  const { lockBuy, isConnected, isCorrectNetwork, switchToCorrectNetwork, account } = useBlockchain();

  // Generate hashed secret whenever secret changes
  useEffect(() => {
    if (secret) {
      generateHashedSecret();
    }
  }, [secret]);
  
  // Set standard USDT values for common amounts
  const setUsdtAmount = (amount) => {
    // USDT on Sepolia has 6 decimals 
    const rawAmount = amount * 1000000; // 1 USDT = 1000000 units
    setRawTokenValue(rawAmount.toString());
    setUseRawValue(true);
  };
  
  // Set standard USDT values for sell price
  const setUsdtSellPrice = (amount) => {
    // USDT on Sepolia has 6 decimals
    const rawAmount = amount * 1000000; // 1 USDT = 1000000 units
    setRawSellPrice(rawAmount.toString());
    setUseRawSellPrice(true);
  };

  const generateHashedSecret = () => {
    if (!secret) return;
    
    try {
      // Generate a random secret if not provided
      if (secret === 'random') {
        // Generate random bytes for the secret (32 bytes)
        const randomSecret = ethers.randomBytes(32);
        const randomSecretHex = ethers.hexlify(randomSecret);
        setSecret(randomSecretHex);
        
        // Hash using the AbiCoder approach
        const hashedSecret = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(["bytes32"], [randomSecretHex])
        );
        
        console.log({
          randomSecret: randomSecretHex,
          hashedSecret: hashedSecret,
        });
        
        setHashedSecret(hashedSecret);
      } else {
        // For text input or manual hex input
        let secretToEncode;
        
        // Check if the input is already a hex string of right length (32 bytes with 0x prefix = 66 chars)
        if (secret.startsWith('0x') && secret.length === 66) {
          // It's already a valid bytes32 hex string
          secretToEncode = secret;
        } else {
          // For text input, create a bytes32 by hashing the text first
          const textBytes = new TextEncoder().encode(secret);
          const textHex = ethers.hexlify(textBytes);
          secretToEncode = ethers.keccak256(textHex); // Create a bytes32 from any text input
        }
        
        // Hash the secret using AbiCoder
        const hashedSecret = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(["bytes32"], [secretToEncode])
        );
        
        console.log({
          secret,
          secretToEncode,
          hashedSecret: hashedSecret,
        });
        
        setHashedSecret(hashedSecret);
      }
    } catch (error) {
      console.error("Error hashing secret:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
      alert("Please enter a valid token address");
      return;
    }
    
    if (!recipient || !ethers.isAddress(recipient)) {
      alert("Please enter a valid recipient address");
      return;
    }
    
    if (!hashedSecret) {
      alert("Please generate a hashed secret first");
      return;
    }
    
    // Check for token value format
    if (useRawValue && !rawTokenValue) {
      alert("Please enter a raw token value");
      return;
    }
    
    // Check for sell price format
    if (useRawSellPrice && !rawSellPrice) {
      alert("Please enter a raw sell price");
      return;
    }
    
    try {
      setLoading(true);
      
      // Use the default asset ID or the provided one
      let formattedSellAssetId = sellAssetId;
      if (!sellAssetId || sellAssetId.trim() === '') {
        formattedSellAssetId = '0x95b58483568979bea3b27def505f49beeda8b41a13274e3622c64e61d087a796';
      } else if (sellAssetId.startsWith('0x') && sellAssetId.length === 66) {
        formattedSellAssetId = sellAssetId;
      } else {
        // If not a valid bytes32 format, use a hash of the input
        formattedSellAssetId = ethers.keccak256(
          ethers.toUtf8Bytes(sellAssetId)
        );
      }
      
      // Format timeout properly - could be either seconds from now or a specific timestamp
      let timeoutValue = Number(timeout);
      
      // Simply use the timeout value as is without any adjustments
      console.log("Using raw timeout value:", timeoutValue);
      
      // Use either the ETH value or the raw token value
      const valueToUse = useRawValue ? rawTokenValue : value;
      // Use either the ETH sell price or the raw sell price
      const sellPriceToUse = useRawSellPrice ? rawSellPrice : sellPrice;
      
      console.log("Submitting lockBuy transaction with parameters:", {
        tokenAddress,
        recipient,
        hashedSecret,
        timeout: timeoutValue,
        value: valueToUse,
        useRawValue,
        sellAssetId: formattedSellAssetId,
        sellPrice: sellPriceToUse,
        useRawSellPrice
      });
      
      await lockBuy(
        tokenAddress,
        recipient,
        hashedSecret,
        timeoutValue,
        valueToUse,
        formattedSellAssetId,
        sellPriceToUse,
        useRawValue,
        useRawSellPrice
      );
    } catch (error) {
      console.error("Error in lockBuy transaction:", error);
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSecretChange = (e) => {
    setSecret(e.target.value);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Lock Buy</CardTitle>
        <CardDescription>
          Create a buy order by locking tokens with a hashed secret
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tokenAddress">Token Address (USDT)</Label>
            <Input
              id="tokenAddress"
              placeholder="0x"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">Default:  (Sepolia USDT)</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="secret">Secret (or type 'random' to generate)</Label>
            <Input
              id="secret"
              placeholder="Enter a secret or 'random'"
              value={secret}
              onChange={handleSecretChange}
              required
            />
          </div>
          
          {hashedSecret && (
            <div className="space-y-2">
              <Label htmlFor="hashedSecret">Hashed Secret</Label>
              <Input
                id="hashedSecret"
                value={hashedSecret}
                readOnly
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="timeout">Timeout (seconds)</Label>
            <Input
              id="timeout"
              type="number"
              min="60"
              value={timeout}
              onChange={(e) => setTimeout(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              Enter the exact timeout value in seconds. This value will be used directly as the lock timeout.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value-format">Token Value Format</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="value-format"
                checked={useRawValue}
                onChange={() => setUseRawValue(!useRawValue)}
              />
              <span>Use raw token value (for tokens with decimals like USDT)</span>
            </div>
          </div>
          
          {useRawValue ? (
            <div className="space-y-2">
              <Label htmlFor="rawTokenValue">Raw Token Value (e.g., 1000000 for 1 USDT)</Label>
              <Input
                id="rawTokenValue"
                value={rawTokenValue}
                onChange={(e) => setRawTokenValue(e.target.value)}
                required={useRawValue}
              />
              <div className="flex space-x-2 mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setUsdtAmount(1)}>1 USDT</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setUsdtAmount(5)}>5 USDT</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setUsdtAmount(10)}>10 USDT</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="value">Token Value</Label>
              <Input
                id="value"
                type="number"
                step="0.000000000000000001"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required={!useRawValue}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="sellAssetId">Default Asset ID</Label>
            <Input
              id="sellAssetId"
              value={sellAssetId}
              onChange={(e) => setSellAssetId(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">Default asset ID is pre-filled for convenience</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price-format">Price Format</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="price-format"
                checked={useRawSellPrice}
                onChange={() => setUseRawSellPrice(!useRawSellPrice)}
              />
              <span>Use raw price (for tokens with decimals like USDT)</span>
            </div>
          </div>
          
          {useRawSellPrice ? (
            <div className="space-y-2">
              <Label htmlFor="rawSellPrice">Raw Sell Price (e.g., 1000000 for 1 USDT)</Label>
              <Input
                id="rawSellPrice"
                value={rawSellPrice}
                onChange={(e) => setRawSellPrice(e.target.value)}
                required={useRawSellPrice}
              />
              <div className="flex space-x-2 mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setUsdtSellPrice(1)}>1 USDT</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setUsdtSellPrice(5)}>5 USDT</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setUsdtSellPrice(10)}>10 USDT</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="sellPrice">Sell Price</Label>
              <Input
                id="sellPrice"
                type="number"
                step="0.000000000000000001"
                min="0"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                required={!useRawSellPrice}
              />
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={loading || !isConnected}>
            {loading ? "Processing..." : "Create Lock Buy"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LockBuy; 