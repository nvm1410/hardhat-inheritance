const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utils/verify")
require("dotenv").config()

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer, user } = await getNamedAccounts()
    const inheritance = await deploy("Inheritance", {
        from: deployer,
        args: [user],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`Inheritance deployed at ${inheritance.address}`)
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(inheritance.address, [user])
    }
}

