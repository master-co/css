export function getSponsorTiers(asPath = ''): {
  name: string,
  icon: string,
  amount: number,
  columns: string,
  gap: number,
  height: number,
  openCollectiveUrl: string,
  githubSponsorUrl: string,
  one?: boolean
}[] {
  const openCollectiveRedirectUrl = 'https://docs.master.co' + asPath.replace('donate', 'sponsor')
  return [
    {
      name: 'diamond',
      icon: '💎',
      amount: 1500,
      columns: '5',
      gap: 50,
      height: 50,
      openCollectiveUrl: 'https://opencollective.com/master-co/contribute/diamond-38288?redirect=https://docs.master.co/sponsor',
      githubSponsorUrl: 'https://github.com/sponsors/master-co/sponsorships?tier_id=117586&preview=false'
    },
    {
      name: 'gold',
      icon: '🥇',
      amount: 500,
      columns: '6',
      gap: 45,
      height: 45,
      openCollectiveUrl: 'https://opencollective.com/master-co/contribute/gold-38286?redirect=' + openCollectiveRedirectUrl,
      githubSponsorUrl: 'https://github.com/sponsors/master-co/sponsorships?tier_id=117585&preview=false'
    },
    {
      name: 'sliver',
      icon: '🥈',
      amount: 250,
      columns: '7',
      gap: 40,
      height: 40,
      openCollectiveUrl: 'https://opencollective.com/master-co/contribute/sliver-38284?redirect=' + openCollectiveRedirectUrl,
      githubSponsorUrl: 'https://github.com/sponsors/master-co/sponsorships?tier_id=117584&preview=false'
    },
    {
      name: 'bronze',
      icon: '🥉',
      amount: 100,
      columns: '8',
      gap: 35,
      height: 35,
      openCollectiveUrl: 'https://opencollective.com/master-co/contribute/bronze-38287?redirect=' + openCollectiveRedirectUrl,
      githubSponsorUrl: 'https://github.com/sponsors/master-co/sponsorships?tier_id=117588&preview=false'
    }
  ]
}
