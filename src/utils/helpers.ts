import * as anchor from "@project-serum/anchor";
import {
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token-latest";
import keccak256 from "keccak256";
import MerkleTree from "merkletreejs";

export async function getWalletBalanceWithMint(
  connection: anchor.web3.Connection,
  walletAddress: anchor.web3.PublicKey,
  tokenMint: anchor.web3.PublicKey
) {
  const associatedTokenAddress = await getAssociatedTokenAddress(
    tokenMint,
    walletAddress
  );

  try {
    // Confirm the account exists
    await getAccount(connection, associatedTokenAddress);

    // Get balance
    const info = await connection.getTokenAccountBalance(
      associatedTokenAddress,
      "processed"
    );
    return info.value.uiAmount;
  } catch {
    return 0;
  }
}

export const getMerkleTree = (mints: anchor.web3.PublicKey[]) => {
  const leaves = mints.map((x) => keccak256(x.toBuffer()));
  const tree = new MerkleTree(leaves, keccak256, { sort: true });
  const root = tree.getRoot();
  return { root: [...root], tree };
};

export const getMerkleProof = (
  mints: anchor.web3.PublicKey[],
  mint: anchor.web3.PublicKey
) => {
  const { tree } = getMerkleTree(mints);
  const leaf = keccak256(mint.toBuffer());
  const proof: Buffer[] = tree.getProof(leaf).map((x) => x.data);
  return proof.map((x) => [...x]);
};

export const getTokenAccountBalance = async (
  connection: anchor.web3.Connection,
  tokenAccount: anchor.web3.PublicKey
) => {
  let tokenAccountBalance = BigInt(0);
  try {
    tokenAccountBalance = (await getAccount(connection, tokenAccount)).amount;
  } catch (error) {}
  return tokenAccountBalance;
};
