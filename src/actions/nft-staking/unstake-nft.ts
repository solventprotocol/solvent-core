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
 * Unstake an NFT from Gemworks Farm
 * @param provider Anchor provider
 * @param dropletMint Droplet mint associated with the bucket
 * @param nftMint Mint of the NFT to be unstaked
 * @returns Promise resolving to the transaction signature
 */
export const unstakeNft = async (
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

  const bucketState = await getBucket(provider.connection, dropletMint);
  const { gembankProgram, gemfarmProgram, gemworksFarm, gemworksFeeAccount } =
    bucketState.stakingParams;
  const gemFarm = getGemFarm(provider, gembankProgram, gemfarmProgram);
  const farmAccount = await gemFarm.fetchFarmAcc(gemworksFarm);

  const farmerAuthority = await getFarmerAuthority(nftMint);
  const farmerRewardATokenAccount = await getAssociatedTokenAddress(
    // @ts-ignore
    farmAccount.rewardA.rewardMint,
    farmerAuthority,
    true
  );
  const farmerRewardBTokenAccount = await getAssociatedTokenAddress(
    // @ts-ignore
    farmAccount.rewardB.rewardMint,
    farmerAuthority,
    true
  );

  // Stake NFT
  transaction.add(
    await solvent.methods
      .unstakeNft()
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
        // @ts-ignore
        gemworksRewardAMint: farmAccount.rewardA.rewardMint,
        // @ts-ignore
        gemworksRewardBMint: farmAccount.rewardB.rewardMint,
        farmerRewardATokenAccount,
        farmerRewardBTokenAccount,
      })
      .instruction()
  );

  // Send the transaction
  return await provider.sendAndConfirm(transaction);
};
