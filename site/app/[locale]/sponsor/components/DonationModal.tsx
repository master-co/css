'use client'

import Modal from 'internal/components/Modal'
import clsx from 'clsx'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'


export default function DonationModal() {
    const [donationOrder, setDonationOrder] = useState<any>(null)
    const searchParams = useSearchParams()

    useEffect(() => {
        let orderId = searchParams?.get('orderId')
        const orderIdV2 = searchParams?.get('orderIdV2')
        const status = searchParams?.get('status')

        let platform = null
        if (orderId && orderIdV2 && status) {
            platform = 'Open Collective'
            orderId = orderIdV2
        }

        if (orderId && platform) {
            (async () => {
                let name = null,
                    amount = null,
                    avatar = null,
                    tier = null,
                    frequency = null,
                    currency = null

                let hasData = false
                try {
                    switch (platform) {
                        case 'Open Collective':
                             
                            const openCollectiveRes = await (await fetch(
                                'https://api.opencollective.com/graphql/v2/7542a8819268783e1eb4f796fbda7f0bbf6793d2',
                                {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        query: `{
                                            order(order: { id: "${orderId}" }) {
                                                id
                                                status
                                                amount {
                                                    value
                                                    currency
                                                }
                                                fromAccount {
                                                    name
                                                    imageUrl
                                                }
                                                tier {
                                                    name
                                                    interval
                                                }
                                            }
                                        }`
                                    })
                                }
                            )).json()

                            name = openCollectiveRes.data.order.fromAccount.name
                            amount = openCollectiveRes.data.order.amount.value
                            currency = openCollectiveRes.data.order.amount.currency
                            tier = openCollectiveRes.data.order.tier?.name || null
                            avatar = openCollectiveRes.data.order.fromAccount.imageUrl
                            frequency = openCollectiveRes.data.order.tier?.interval?.toUpperCase() || null
                            hasData = true

                            break
                    }
                } catch (err) {
                    console.error(err)
                }

                if (hasData) {
                    setDonationOrder({ orderId, name, amount, platform, avatar, tier, frequency, currency })
                }
            })()
        }
    }, [searchParams])

    return donationOrder && <Modal backdropClick={() => setDonationOrder(null)} contentClass="max-w:320px p:20x|1.875rem|1.875rem|1.875rem">
        <div className="abs round inset:0 mi:auto bg:surface h:128px transform:translateY(-50%) w:128px">
            <Image className="rel round mi:auto object-contain top:2px" width="124" height="124" src={donationOrder.avatar} alt="sponsor" />
        </div>
        <div className="font:24px font:bold text-center">{donationOrder.name || 'Unknown'}</div>
        <p className="text-center">Thanks for your donation 🥳</p>

        <ul>
            {donationOrder.tier && (
                <li>
                    <b className="inline-block uppercase::first-letter">{donationOrder.tier.replace('-', ' ')}</b>
                </li>
            )}
            <li>
                <b>
                    {donationOrder.amount} {donationOrder.currency}
                </b>
            </li>
            {donationOrder.frequency && (
                <li>
                    <b>{donationOrder.frequency}</b>
                </li>
            )}
            <li>
                <b>{donationOrder.platform}</b>
            </li>
        </ul>
    </Modal>
}
