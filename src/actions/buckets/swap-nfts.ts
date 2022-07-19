import * as anchor from "@project-serum/anchor";
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token-latest";
import { SOLVENT_CORE_TREASURY } from "../../constants";
import { getSolventAuthority, getTokenMetadata, getSolvent } from "../../utils";

/**
 * Swap an NFT for another on in a bucket
 * @param provider Anchor provider
 * @param dropletMint Droplet mint associated with the bucket
 * @param nftToDepositMint Mint of the NFT to be deposited into the bucket
 * @param nftToRedeemMint Mint of the NFT to be redeemed from the bucket
 * @param whitelistProof Merkle proof of the NFT to be deposited belonging to the collection whitelist, defaults to Solvent's collection database
 * @param nftToDepositTokenAccount Token account from which NFT will be deposited, defaults to the associated token account of wallet
 * @param nftToRedeemTokenAccount Token account to which the redeemed NFT is to be sent, defaults to the associated token account of wallet
 * @returns Promise resolving to the list of transaction signatures
 */
export const swapNfts = async (
  provider: anchor.AnchorProvider,
  dropletMint: anchor.web3.PublicKey,
  nftToDepositMint: anchor.web3.PublicKey,
  nftToRedeemMint: anchor.web3.PublicKey,
  whitelistProof?: number[][],
  nftToDepositTokenAccount?: anchor.web3.PublicKey,
  nftToRedeemTokenAccount?: anchor.web3.PublicKey
) => {
  const solvent = getSolvent(provider);
  const txSignatures = [];

  const createAccountsTx = new anchor.web3.Transaction();

  // Use wallet's ATA as the NFT token account if not passed as argument
  if (!nftToRedeemTokenAccount) {
    nftToRedeemTokenAccount = await getAssociatedTokenAddress(
      nftToRedeemMint,
      provider.wallet.publicKey
    );
    // Check if the ATA exists, otherwise initialize it
    try {
      await getAccount(provider.connection, nftToRedeemTokenAccount);
    } catch {
      createAccountsTx.add(
        createAssociatedTokenAccountInstruction(
          provider.wallet.publicKey,
          nftToRedeemTokenAccount,
          provider.wallet.publicKey,
          nftToRedeemMint
        )
      );
    }
  }

  // Use wallet's ATA as the NFT token account if not passed as argument
  if (!nftToDepositTokenAccount) {
    nftToDepositTokenAccount = await getAssociatedTokenAddress(
      nftToDepositMint,
      provider.wallet.publicKey
    );
  }

  // Solvent's NFT token accounts
  const solventAuthority = await getSolventAuthority();
  const solventNftToDepositTokenAccount = await getAssociatedTokenAddress(
    nftToDepositMint,
    solventAuthority,
    true
  );
  const solventNftToRedeemTokenAccount = await getAssociatedTokenAddress(
    nftToRedeemMint,
    solventAuthority,
    true
  );

  // Use wallet's ATA as the droplet token account
  const dropletTokenAccount = await getAssociatedTokenAddress(
    dropletMint,
    provider.wallet.publicKey
  );
  // Check if the ATA exists, otherwise initialize it
  try {
    await getAccount(provider.connection, dropletTokenAccount);
  } catch {
    createAccountsTx.add(
      createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        dropletTokenAccount,
        provider.wallet.publicKey,
        dropletMint
      )
    );
  }

  const solventTreasuryDropletTokenAccount = await getAssociatedTokenAddress(
    dropletMint,
    SOLVENT_CORE_TREASURY
  );

  // Create token accounts if necessary
  if (createAccountsTx.instructions.length > 0) {
    const sig = await provider.sendAndConfirm(createAccountsTx);
    txSignatures.push(sig);
  }

  const nftToDepositBalance = await provider.connection.getTokenAccountBalance(
    nftToDepositTokenAccount
  );
  const solventNftToDepositBalance =
    await provider.connection.getTokenAccountBalance(
      solventNftToDepositTokenAccount
    );

  if (
    parseInt(nftToDepositBalance.value.amount) === 0 &&
    parseInt(solventNftToDepositBalance.value.amount) === 1
  ) {
    // whitelistProof is expected to be passed in case of v1 type of collection, can be null otherwise
    whitelistProof = whitelistProof ? whitelistProof : null;
    const nftToDeposiMetadata = await getTokenMetadata(nftToDepositMint);

    // Deposit NFT for swap
    const sig = await solvent.methods
      .depositNft(true, whitelistProof)
      .accounts({
        signer: provider.wallet.publicKey,
        dropletMint,
        nftMint: nftToDepositMint,
        nftMetadata: nftToDeposiMetadata,
        signerNftTokenAccount: nftToDepositTokenAccount,
        solventNftTokenAccount: solventNftToDepositTokenAccount,
        destinationDropletTokenAccount: dropletTokenAccount,
      })
      .rpc();

    txSignatures.push(sig);
  }

  const nftToRedeemBalance = await provider.connection.getTokenAccountBalance(
    nftToDepositTokenAccount
  );
  const solventNftToRedeemBalance =
    await provider.connection.getTokenAccountBalance(
      solventNftToDepositTokenAccount
    );

  if (
    parseInt(nftToRedeemBalance.value.amount) === 0 &&
    parseInt(solventNftToRedeemBalance.value.amount) === 1
  ) {
    // Redeem NFT for swap
    const sig = await solvent.methods
      .redeemNft(true)
      .accounts({
        signer: provider.wallet.publicKey,
        dropletMint,
        nftMint: nftToRedeemMint,
        solventNftTokenAccount: solventNftToRedeemTokenAccount,
        destinationNftTokenAccount: nftToRedeemTokenAccount,
        signerDropletTokenAccount: dropletTokenAccount,
        solventTreasury: SOLVENT_CORE_TREASURY,
        solventTreasuryDropletTokenAccount,
      })
      .rpc();

    txSignatures.push(sig);
  }

  // Return the transaction signatures
  return txSignatures;
};
