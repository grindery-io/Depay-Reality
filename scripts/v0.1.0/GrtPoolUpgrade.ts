import { ethers, upgrades } from "hardhat";

const GRT_POOL_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

async function main() {

    const grtPool = await upgrades.upgradeProxy(
        GRT_POOL_ADDRESS,
        await ethers.getContractFactory(
            "contracts/v0.1.0/GrtPool.sol:GrtPool"
        )
    );

    console.log("GRT pool upgraded to:", grtPool.address);
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