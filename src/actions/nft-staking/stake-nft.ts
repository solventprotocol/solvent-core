import * as anchor from "@project-serum/anchor";
import { getAssociatedTokenAddress } from "@solana/spl-token-latest";
import {
  getSolventAuthority,
  getSolvent,
  getFarmerAuthority,
  getGemFarm,
} from "../../utils";
import { getBucket } from "../buckets/get-bucket";

/**
 * Stake an NFT to Gemworks Farm
 * @param provider Anchor provider
 * @param dropletMint Droplet mint associated with the bucket
 * @param nftMint Mint of the NFT to be staked
 * @returns Promise resolving to the transaction signature
 */
export const stakeNft = async (
  provider: anchor.AnchorProvider,
  dropletMint: anchor.web3.PublicKey,
  nftMint: anchor.web3.PublicKey
) => {
  const solvent = getSolvent(provider);
  const transaction = new anchor.web3.Transaction();

  const solventAuthority = await getSolventAuthority();
  const solventNftTokenAccount = await getAssociatedTokenAddress(
    nftMint,
    solventAuthority,
    true
  );

  const farmerAuthority = await getFarmerAuthority(nftMint);
  const farmerNftTokenAccount = await getAssociatedTokenAddress(
    nftMint,
    farmerAuthority,
    true
  );

  const bucketState = await getBucket(provider.connection, dropletMint);
  const { gembankProgram, gemfarmProgram, gemworksFarm, gemworksFeeAccount } =
    bucketState.stakingParams;
  const gemFarm = getGemFarm(provider, gembankProgram, gemfarmProgram);
  const farmAccount = await gemFarm.fetchFarmAcc(gemworksFarm);

  // Stake NFT
  transaction.add(
    await solvent.methods
      .stakeNft()
      .accounts({
        signer: provider.wallet.publicKey,
        dropletMint,
        gembankProgram,
        gemfarmProgram,
        gemworksBank: farmAccount.bank,
        gemworksFarm,
        gemworksFeeAccount,
        nftMint,
        solventNftTokenAccount,
        farmerNftTokenAccount,
      })
      .instruction()
  );

  // Send the transaction
  return await provider.sendAndConfirm(transaction);
};
