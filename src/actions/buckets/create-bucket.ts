import * as anchor from "@project-serum/anchor";
import { getSolvent } from "../../utils";

interface CollectionInfoV1 {
  symbol: string;
  verifiedCreators: anchor.web3.PublicKey[];
  whitelistRoot: number[];
}

interface CollectionInfoV2 {
  collectionMint: anchor.web3.PublicKey;
}

const isCollectionInfoV1 = (
  collectionInfo: CollectionInfoV1 | CollectionInfoV2
): collectionInfo is CollectionInfoV1 => {
  return (collectionInfo as CollectionInfoV1).symbol !== undefined;
};

/**
 * Create a bucket
 * @param provider Anchor provider
 * @param collectionInfo Information identifying the NFT collection for which the bucket will be created
 * @returns Promise resolving to tuple containing created droplet mint and the transaction signature
 */
export const createBucket = async (
  provider: anchor.AnchorProvider,
  collectionInfo: CollectionInfoV1 | CollectionInfoV2
): Promise<[anchor.web3.PublicKey, anchor.web3.TransactionSignature]> => {
  const solvent = getSolvent(provider);
  // Generate the bucket mint
  const dropletMintKeypair = new anchor.web3.Keypair();

  const transaction = new anchor.web3.Transaction();

  transaction.add(
    await solvent.methods
      .createBucket(
        // @ts-ignore
        isCollectionInfoV1(collectionInfo)
          ? { v1: collectionInfo }
          : { v2: collectionInfo }
      )
      .accounts({
        signer: provider.wallet.publicKey,
        dropletMint: dropletMintKeypair.publicKey,
      })
      .instruction()
  );

  const txSign = await provider.sendAndConfirm(transaction, [
    dropletMintKeypair,
  ]);
  return [dropletMintKeypair.publicKey, txSign];
};
