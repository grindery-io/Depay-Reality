import { ethers, upgrades } from "hardhat";

const GRT_ADDRESS = "0x0000000000000000000000000000000000000000";
const GRT_CHAIN_ID = 5;
const REALITY_ADDRESS = "0x0000000000000000000000000000000000000000";

async function main() {

    const grtPool = await upgrades.deployProxy(
        await ethers.getContractFactory("GrtPool")
    );

    await grtPool.deployed();
    await grtPool.initializePool(GRT_ADDRESS, GRT_CHAIN_ID, REALITY_ADDRESS);

    console.log("GRT pool deployed to:", grtPool.address);
    console.log("GRT pool - owner address:", await grtPool.owner());
    console.log("GRT pool - GRT address:", await grtPool.grtAddress());
    console.log("GRT pool - GRT chain id:", await grtPool.grtChainId());
    console.log("GRT pool - Reality address:", await grtPool.realityAddress());

}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error)
    process.exit(1)
})