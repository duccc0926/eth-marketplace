import { useHooks } from "@components/providers/web3"
import { useEffect } from "react"
import { useWeb3 } from "@components/providers"
import { useRouter } from "next/router"

// export const useAccount = () => {
//   return useHooks(hooks => hooks.useAccount)()
// }

// export const useNetwork = () => {
//     return useHooks(hooks => hooks.useNetwork)()
// }

const _isEmpty = data => {
    return (
        data == null ||
        data === "" ||
        (Array.isArray(data) && data.length === 0) ||
        (data.constructor === Object && Object.keys(data).length === 0)
    )
}

const enhanceHook = swrRes => {
    const { data, error } = swrRes
    const hasInitialResponse = !!(data || error)
    const isEmpty = hasInitialResponse && _isEmpty(data)
    return {
        ...swrRes,
        isEmpty,
        hasInitialResponse
    }
}

export const useNetwork = () => {
    const swrRes = enhanceHook(useHooks(hooks => hooks.useNetwork)())
    return {
        network: swrRes
    }
}

export const useAccount = () => {
    const swrRes = enhanceHook(useHooks(hooks => hooks.useAccount)())
    return {
        account: swrRes
    }
}

export const useOwnedCourses = (...args) => {
    const res = enhanceHook(useHooks(hooks => hooks.useOwnedCourses)(...args))

    return {
        ownedCourses: res
    }
}

export const useOwnedCourse = (...args) => {
    const res = enhanceHook(useHooks(hooks => hooks.useOwnedCourse)(...args))

    return {
        ownedCourse: res
    }
}

export const useManagedCourses = (...args) => {
    const res = enhanceHook(useHooks(hooks => hooks.useManagedCourses)(...args))

    return {
        managedCourses: res
    }
}

export const useWalletInfo = () => {
    const { account } = useAccount()
    const { network } = useNetwork()

    const isConnecting =
        !account.hasInitialResponse &&
        !network.hasInitialResponse


    return {
        account,
        network,
        isConnecting,
        hasConnectedWallet: !!(account.data && network.isSupported)
    }
}

export const useAdmin = ({ redirectTo }) => {
    const { account } = useAccount()
    const { requireInstall } = useWeb3()
    const router = useRouter()

    useEffect(() => {
        if ((
            requireInstall ||
            account.hasInitialResponse && !account.isAdmin) ||
            account.isEmpty) {

            router.push(redirectTo)
        }
    }, [account])

    return { account }
}