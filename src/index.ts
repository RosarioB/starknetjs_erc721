import {
  Account,
  RpcProvider,
  Contract,
  json,
  cairo,
  Call,
} from "starknet";
import "dotenv/config";
import * as fs from "fs";
import erc20Abi from "../erc20.json" with { type: 'json' };
import BigNumber from "bignumber.js";

const DEPLOYED_CONTRACT =
  "0x062217de4d51800c4c627d98bf820d9b6d16a1c4d8cd5f0f91645bf8f22bab5e";

const ADDR_ETH =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

const mapTokenIdUri = new Map<number, string>(); //token id - uri
mapTokenIdUri.set(
  1,
  "ipfs://bafkreigjgrjetsnmsb4ouzu7o5i4jfuktrxu5egbxzhpntetwq2teq5pp4"
);
mapTokenIdUri.set(
  2,
  "ipfs://bafkreiga3py5q645lxjggsvmaoi6w3252j7ekrwezcouwbvzk2wnmf4gaq"
);
mapTokenIdUri.set(
  3,
  "ipfs://bafkreigobjksa7dsdn7kebcuc2eyhje564qhwea35tjbjoo2nz5vsj73le"
);
mapTokenIdUri.set(
  4,
  "ipfs://bafkreif3q4uq4jvv6xk54xrkxtx6zdh7entphgkx2mxpkxughtsw7ssu3m"
);
mapTokenIdUri.set(
  5,
  "ipfs://bafkreihlo2qz3uhk5udvyauc3h4yv7oy7yorkeytuykwbr3amamkx74rjq"
);
mapTokenIdUri.set(
  6,
  "ipfs://bafkreibyhanh2vrkpvhjsc5ouh7cdh3ee4aldcjxvvqpfqq3fp4lrg6dbm"
);

const getTotalSupply = async (contract: Contract) => {
  const totalSupply = await contract.total_supply();
  console.log(`The total supply is: ${totalSupply}`);
};

const getTokenUri = async (contract: Contract, tokenId: number) => {
  const uri = await contract.get_token_uri(tokenId);
  console.log(`The URI of the token ${tokenId} is: ${uri}`);
};

const tokenBalance = async (contract: Contract, address: string) => {
  const tokenBalance = await contract.balance_of(address);
  console.log(`The account ${address} has: ${tokenBalance} tokens`);
};

const mintNft = async (
  contract: Contract,
  account: Account,
  provider: RpcProvider,
  recipient: string,
  uri: string
) => {
  // Transaction with fees paid in ETH
  const mintCall = contract.populate("mint_item", { recipient, uri });
  const { transaction_hash: transferTxHash } = await account.execute(mintCall, {
    version: 3, // version 3 to pay fees in STRK. To pay fees in ETH remove the version field
  });
  // Wait for the invoke transaction to be accepted on Starknet
  const receipt = await provider.waitForTransaction(transferTxHash);
  console.log(receipt);
};

const getContractName = async (contract: Contract) => {
  const name = await contract.name();
  console.log("Contract's name ", name);
};

const exportAbiToFile = async (provider: RpcProvider) => {
  const compressedContract = await provider.getClassAt(DEPLOYED_CONTRACT);
  fs.writeFileSync(
    "./labels.json",
    JSON.stringify(compressedContract.abi, undefined, 2)
  );
};

const getEthBalance = async (erc20: Contract, account: Account) => {
  const balance = BigNumber(await erc20.balance_of(account.address)).dividedBy(
    10 ** 18
  );
  console.log(`The account ${account.address} has: ${balance} tokens`);
};

const trasferEth = async (
  erc20: Contract,
  account: Account,
  provider: RpcProvider,
  amount: number,
  recipient: string
) => {
  const transferCallData: Call = erc20.populate("transfer", {
    recipient,
    amount: cairo.uint256(amount * 10 ** 18),
  });
  const { transaction_hash: transferTxHash } = await account.execute(
    transferCallData,
    { version: 3 }
  );
  const receipt = await provider.waitForTransaction(transferTxHash);
  console.log(receipt);
};

const main = async () => {
  // Initialize provider
  const provider = new RpcProvider({
    nodeUrl: process.env.STARKNET_RPC_URL,
  });

  // Connect to the account
  const account = new Account(
    provider,
    process.env.STARKNET_ADDRESS,
    process.env.STARKNET_PRIVATE_KEY
  );

  //await exportAbiToFile(provider);

  // Load the contract ABI from the file
  const abi = json.parse(fs.readFileSync("./labels.json").toString("ascii"));

  // Connect the contract
  const erc721 = new Contract(abi, DEPLOYED_CONTRACT, provider);
  erc721.connect(account);

  //await getContractName(erc721);

  // Mint NFTs ERC721
  /* await mintNft(
    erc721,
    account,
    provider,
    account.address,
    mapTokenIdUri.get(3)
  );

  await tokenBalance(erc721, account.address);

  await getTokenUri(erc721, 3);

  await getTotalSupply(erc721); */

  // Transfer ETH ERC20
  const erc20Eth = new Contract(erc20Abi, ADDR_ETH, provider);
  erc20Eth.connect(account);

  await getEthBalance(erc20Eth, account);

  await trasferEth(
    erc20Eth,
    account,
    provider,
    0.0000000001,
    "0x0536e6dc3bf60e99a18540614aa3246bcb4f9e68c0e6e681c0d3557b208cebec"
  );

  await getEthBalance(erc20Eth, account);
};

main().catch(console.error);
