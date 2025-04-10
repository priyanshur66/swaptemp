import { useState } from 'react';
import { ethers } from 'ethers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBlockchain } from '@/lib/blockchain-context';

const LockSell = () => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [recipient, setRecipient] = useState('');
  const [secret, setSecret] = useState('');
  const [hashedSecret, setHashedSecret] = useState('');
  const [timeout, setTimeout] = useState(3600); // 1 hour in seconds
  const [value, setValue] = useState('0.01'); // Default amount
  const [buyAssetId, setBuyAssetId] = useState('');
  const [buyLockId, setBuyLockId] = useState('');
  const [loading, setLoading] = useState(false);

  const { lockSell, isConnected, isCorrectNetwork, switchToCorrectNetwork } = useBlockchain();



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
    
    // Ensure valid format for asset ID and lock ID
    const formattedBuyAssetId = buyAssetId && buyAssetId.trim() !== '' 
      ? (buyAssetId.startsWith('0x') && buyAssetId.length === 66 
          ? buyAssetId 
          : ethers.keccak256(ethers.toUtf8Bytes(buyAssetId)))
      : ethers.ZeroHash;
    
    const formattedBuyLockId = buyLockId && buyLockId.trim() !== ''
      ? (buyLockId.startsWith('0x') && buyLockId.length === 66
          ? buyLockId
          : ethers.keccak256(ethers.toUtf8Bytes(buyLockId)))
      : ethers.ZeroHash;
    
    try {
      setLoading(true);
      
      console.log("Submitting lockSell transaction with parameters:", {
        tokenAddress,
        recipient,
        hashedSecret,
        timeout: Number(timeout),
        value,
        buyAssetId: formattedBuyAssetId,
        buyLockId: formattedBuyLockId
      });
      
      await lockSell(
        tokenAddress,
        recipient,
        hashedSecret,
        Number(timeout),
        value,
        formattedBuyAssetId,
        formattedBuyLockId
      );
    } catch (error) {
      console.error("Error in lockSell transaction:", error);
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Lock Sell</CardTitle>
        <CardDescription>
          Create a sell order by locking tokens for a specific buy order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tokenAddress">Token Address</Label>
            <Input
              id="tokenAddress"
              placeholder="0x..."
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              required
            />
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
            <Label htmlFor="secret">Enter hashed secret </Label>
            <div className="flex space-x-2">
              <Input
                id="secret"
                placeholder="Enter a secret or 'random'"
                value={hashedSecret}
                onChange={(e) => setHashedSecret(e.target.value)}
                required
              />
              
            </div>
          </div>
          
         
          
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value">Value </Label>
            <Input
              id="value"
              type="number"
              step="0.000000000000000001"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="buyAssetId">Buy Asset ID</Label>
            <Input
              id="buyAssetId"
              placeholder="0x..."
              value={buyAssetId}
              onChange={(e) => setBuyAssetId(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="buyLockId">Buy Lock ID</Label>
            <Input
              id="buyLockId"
              placeholder="0x..."
              value={buyLockId}
              onChange={(e) => setBuyLockId(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading || !isConnected}>
            {loading ? "Processing..." : "Create Lock Sell"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LockSell; 