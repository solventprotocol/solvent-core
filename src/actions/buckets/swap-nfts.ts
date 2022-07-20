import * as anchor from "@project-serum/anchor";
import { depositNft } from "./deposit-nft";
import { getSwap } from "./get-swap";
import { redeemNft } from "./redeem-nft";

/**
 * Swap an NFT for another on in a bucket
 * @param provider Anchor provider
 * @param dropletMint Droplet mint associated with the bucket
 * @param nftToRedeemMint Mint of the NFT to be redeemed from the bucket
 * @param nftToDepositMint Mint of the NFT to be deposited into the bucket
 * @param whitelistProof Merkle proof of the NFT to be deposited belonging to the collection whitelist, needed if NFT does not have on-chain collection
 * @param dropletTokenAccount Token account from which droplets would be taken as fee, defaults to the associated token account of wallet
 * @param nftToDepositTokenAccount Token account from which NFT will be deposited, defaults to the associated token account of wallet
 * @param nftToRedeemTokenAccount Token account to which the redeemed NFT is to be sent, defaults to the associated token account of wallet
 * @returns Promise resolving to the list of transaction signatures
 */
export const swapNfts = async (
  provider: anchor.AnchorProvider,
  dropletMint: anchor.web3.PublicKey,
  nftToRedeemMint: anchor.web3.PublicKey,
  nftToDepositMint?: anchor.web3.PublicKey,
  whitelistProof?: number[][],
  dropletTokenAccount?: anchor.web3.PublicKey,
  nftToDepositTokenAccount?: anchor.web3.PublicKey,
  nftToRedeemTokenAccount?: anchor.web3.PublicKey
) => {
  const txSignatures = [];

  const swapState = await getSwap(
    provider.connection,
    dropletMint,
    provider.wallet.publicKey
  );

  // Deposit only if user passed it as argument and if user is not in-between a swap
  if (nftToDepositMint && !(swapState && swapState.flag)) {
    // Deposit NFT for swap
    const sig = await depositNft(
      provider,
      dropletMint,
      nftToDepositMint,
      whitelistProof ? whitelistProof : null,
      true,
      nftToDepositTokenAccount,
      dropletTokenAccount
    );
    txSignatures.push(sig);
  }

  // Redeem NFT for swap
  const sig = await redeemNft(
    provider,
    dropletMint,
    nftToRedeemMint,
    true,
    nftToRedeemTokenAccount,
    dropletTokenAccount
  );
  txSignatures.push(sig);

  // Return the transaction signatures
  return txSignatures;
};
