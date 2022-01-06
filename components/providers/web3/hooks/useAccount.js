import { useEffect, useState } from "react"
import useSWR from "swr"

const adminAddresses = {
  "0x08ebd42e6194e57de3ad32f081e5da82ed2608113daae0352be36c182e2f6c53": true,
  "0xd2eeda32a24226089ce87d277ef79cf359a0a07aa8d5cbc9ca5cbff6033e93a2": true
}

export const handler = (web3, provider) => () => {
  const { data, mutate, ...rest } = useSWR(() =>
    web3 ? "web3/accounts" : null,
    async () => {
      const accounts = await web3.eth.getAccounts()
      const account = accounts[0]

      if (!account) {
        throw new Error("Cannot retreive an account. Please refresh the browser.")
      }

      return account
    })

  useEffect(() => {
    const mutator = accounts => mutate(accounts[0] ?? null)
    provider?.on("accountsChanged", mutator)
    return () => {
      provider?.removeListener("accountsChanged", mutator)
    }
  }, [provider])

  return {
    data,
    isAdmin: (
      data &&
      adminAddresses[web3.utils.keccak256(data)]) ?? false,
    mutate,
    ...rest
  }
}