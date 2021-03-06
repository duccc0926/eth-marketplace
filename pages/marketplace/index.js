import { ListCourse, CourseCard } from "@components/ui/course"
import { BaseLayout } from "@components/ui/layout"
import { getAllCourses } from "@content/courses/fetcher"
import { useOwnedCourses, useWalletInfo } from "@components/hooks/web3"
import { Button, Loader, Message } from "@components/ui/common"
import { OrderModal } from "@components/ui/order"
import { useState } from "react";
import { MarketHeader } from "@components/ui/marketplace"
import { useWeb3 } from "@components/providers"
import { withToast } from "@utils/toast"

export default function Marketplace({ courses }) {
    const [selectedCourse, setSelectedCourse] = useState(null)
    const [isNewPurchase, setIsNewPurchase] = useState(true)

    const { web3, contract, requireInstall } = useWeb3()
    const { hasConnectedWallet, isConnecting, account } = useWalletInfo()
    const { ownedCourses } = useOwnedCourses(courses, account.data)
    const [busyCourseId, setBusyCourseId] = useState(null)

    const purchaseCourse = async (order, course) => {

        const hexCourseId = web3.utils.utf8ToHex(course.id)
        const orderHash = web3.utils.soliditySha3(
            { type: "bytes16", value: hexCourseId },
            { type: "address", value: account.data }
        )

        const value = web3.utils.toWei(String(order.price))

        setBusyCourseId(course.id)

        if (isNewPurchase) {
            const emailHash = web3.utils.sha3(order.email)
            const proof = web3.utils.soliditySha3(
                { type: "bytes32", value: emailHash },
                { type: "bytes32", value: orderHash }
            )

            withToast(_purchaseCourse(hexCourseId, proof, value))
        } else {
            withToast(_repurchaseCourse(orderHash, value))
        }

        cleanupModal()
    }

    const _purchaseCourse = async (hexCourseId, proof, value) => {
        try {
            const result = await contract.methods.purchaseCourse(
                hexCourseId,
                proof
            ).send({ from: account.data, value })
            ownedCourses.mutate()
        } catch {
            console.error("Purchase course: Operation has failed.")
        } finally {
            setBusyCourseId(null)
        }
    }

    const _repurchaseCourse = async (courseHash, value) => {
        try {
            const result = await contract.methods.repurchaseCourse(
                courseHash
            ).send({ from: account.data, value })
            console.log(result)
        } catch {
            console.error("Purchase course: Operation has failed.")
        } finally {
            setBusyCourseId(null)
        }
    }

    const cleanupModal = () => {
        setSelectedCourse(null)
        setIsNewPurchase(true)
    }

    return (
        <>
            <MarketHeader />
            <ListCourse
                courses={courses}
            >
                {course => {
                    const owned = ownedCourses.lookup[course.id]
                    return (
                        <CourseCard
                            key={course.id}
                            course={course}
                            state={owned?.state}
                            disabled={!hasConnectedWallet}
                            Footer={() => {
                                if (requireInstall) {
                                    return (
                                        <Button
                                            size="sm"
                                            disabled={true}
                                            variant="lightPurple">
                                            Install
                                        </Button>
                                    )
                                }

                                if (isConnecting) {
                                    return (
                                        <Button
                                            size="sm"
                                            disabled={true}
                                            variant="lightPurple">
                                            <Loader size="sm" />
                                        </Button>
                                    )
                                }

                                if (!ownedCourses.hasInitialResponse) {
                                    return (
                                        <Button
                                            variant="white"
                                            disabled={true}
                                            size="sm">
                                            {hasConnectedWallet ?
                                                "Loading State..." :
                                                "Connect"
                                            }
                                        </Button>
                                    )
                                }

                                const isBusy = busyCourseId === course.id

                                if (owned) {
                                    return (
                                        <>
                                            <div className="flex">
                                                <Button
                                                    onClick={() => alert("You are owner of this course.")}
                                                    disabled={false}
                                                    size="sm"
                                                    variant="white">
                                                    Yours &#10004;
                                                </Button>
                                                {owned.state === "deactivated" &&
                                                    <Button
                                                        size="sm"
                                                        disabled={false}
                                                        onClick={() => {
                                                            setIsNewPurchase(false)
                                                            setSelectedCourse(course)
                                                        }}
                                                        variant="purple">
                                                        Fund to Activate
                                                    </Button>
                                                }
                                            </div>
                                        </>
                                    )
                                }


                                return (
                                    <Button
                                        onClick={() => setSelectedCourse(course)}
                                        size="sm"
                                        disabled={!hasConnectedWallet || isBusy}
                                        variant="lightPurple">
                                        {isBusy ?
                                            <div className="flex">
                                                <Loader size="sm" />
                                                <div className="ml-2">In Progress</div>
                                            </div> :
                                            <div>Purchase</div>
                                        }
                                    </Button>
                                )
                            }
                            }
                        />
                    )
                }
                }
            </ListCourse>
            {selectedCourse &&
                <OrderModal
                    course={selectedCourse}
                    isNewPurchase={isNewPurchase}
                    onSubmit={(formData, course) => {
                        purchaseCourse(formData, course)
                        cleanupModal()
                    }}
                    onClose={cleanupModal}
                />
            }
        </>
    )
}

export function getStaticProps() {
    const { data } = getAllCourses();
    return {
        props: {
            courses: data
        }
    }
}

Marketplace.Layout = BaseLayout