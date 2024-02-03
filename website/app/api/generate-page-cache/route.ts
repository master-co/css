import githubToken from 'websites/tokens/github'
import i18n from '~/i18n.config.mjs'
import token from 'websites/tokens/api'

export async function POST(req: Request) {
    const tokenParam = new URL(req.url).searchParams.get('token')
    if (tokenParam !== token)
        return new Response(null, { status: 401 })
    
    for (const eachLocale of i18n.locales) {
        fetch(
            `https://api.github.com/repos/${process.env.VERCEL_GIT_REPO_OWNER}/css/actions/workflows/generate-page-cache.yml/dispatches`,
            {
                method: 'POST',
                body: JSON.stringify({
                    ref: process.env.VERCEL_GIT_COMMIT_REF,
                    inputs: {
                        locale: eachLocale
                    }
                }),
                headers: {
                    'User-Agent': 'Master CSS Generate Page Cache',
                    'X-GitHub-Api-Version': '2022-11-28',
                    Authorization: 'Bearer ' + githubToken
                }
            }
        )
    }

    return new Response(null, { status: 200 })
}