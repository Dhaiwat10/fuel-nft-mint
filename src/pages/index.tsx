import type { TestContractAbi } from '@/sway-api';
import { TestContractAbi__factory } from '@/sway-api';
import contractIds from '@/sway-api/contract-ids.json';
import { MetadataOutput } from '@/sway-api/contracts/TestContractAbi';
import { Option } from '@/sway-api/contracts/common';
import { Button, FuelLogo, HStack, Heading, VStack } from '@fuel-ui/react';
import {
  BaseAssetId,
  Provider,
  Wallet,
  WalletUnlocked,
  ZeroBytes32,
  bn,
  concat,
  hash,
} from 'fuels';
import { useEffect, useState } from 'react';
import { IpfsImage } from 'react-ipfs-image';

const contractId = contractIds.testContract;

const imgHash = 'QmWZrnFiwbrwrNtVEoaoaSryL2CZhLphMfA7KN4pg9Ut1b';

export default function Home() {
  const [contractInstance, setContractInstance] = useState<TestContractAbi>();
  const [wallet, setWallet] = useState<WalletUnlocked>();
  const [metadata, setMetadata] = useState<Option<MetadataOutput>>();

  useEffect(() => {
    (async () => {
      const provider = await Provider.create('http://127.0.0.1:4000/graphql');
      // 0x1 is the private key of one of the fauceted accounts on your local Fuel node
      const wallet = Wallet.fromPrivateKey('0x01', provider);
      const testContract = TestContractAbi__factory.connect(contractId, wallet);
      setWallet(wallet);
      setContractInstance(testContract);
    })().catch(console.error);
  }, []);

  const onMintClicked = async () => {
    if (contractInstance && wallet) {
      await contractInstance.functions
        .mint(
          { Address: { value: wallet.address.toB256() } },
          ZeroBytes32,
          bn(1)
        )
        .txParams({
          gasPrice: 1,
          gasLimit: 20_000,
        })
        .call();
    }
  };

  const onSetMetadataClicked = async () => {
    if (contractInstance && wallet) {
      await contractInstance.functions
        .set_metadata(
          {
            value: hash(concat([contractId, BaseAssetId])),
          },
          'image',
          {
            String: `ipfs://${imgHash}`,
          }
        )
        .txParams({
          gasPrice: 1,
          gasLimit: 20_000,
        })
        .call();
    }
  };

  const getNFT = async () => {
    if (contractInstance) {
      const { value } = await contractInstance.functions
        .metadata(
          {
            value: hash(concat([contractId, BaseAssetId])),
          },
          'image'
        )
        .txParams({
          gasPrice: 1,
          gasLimit: 20_000,
        })
        .simulate();
      setMetadata(value);
    }
  };

  return (
    <VStack className={`min-h-screen items-center p-24`}>
      <HStack>
        <FuelLogo />
        <Heading>Fuel NFT mint</Heading>
      </HStack>

      {contractInstance && (
        <Heading>Contract ID: {contractInstance.id.toB256()}</Heading>
      )}

      <IpfsImage hash={imgHash} className='w-[300px]' />

      {metadata && <pre>{JSON.stringify(metadata, null, 2)}</pre>}

      <Button
        onPress={getNFT}
        style={{
          marginTop: 24,
        }}
      >
        Get NFT
      </Button>

      <Button
        onPress={onMintClicked}
        style={{
          marginTop: 24,
        }}
      >
        Mint
      </Button>

      <Button
        onPress={onSetMetadataClicked}
        style={{
          marginTop: 24,
        }}
      >
        Set Metadata
      </Button>
    </VStack>
  );
}
