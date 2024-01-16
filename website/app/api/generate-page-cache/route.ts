import getCurrentGitBranch from 'current-git-branch'
import githubToken from 'websites/tokens/github'
import i18n from 'websites/i18n.config.mjs'
import token from 'websites/tokens/api'

const currentBranch = getCurrentGitBranch()

export async function POST(req: Request) {
    const tokenParam = new URL(req.url).searchParams.get('token')
    if (tokenParam !== token)
        return new Response(null, { status: 401 })

    for (const eachLocale of i18n.locales) {
        fetch(
            `https://api.github.com/repos/${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}/actions/workflows/generate-page-cache.yml/dispatches`,
            {
                method: 'POST',
                body: JSON.stringify({
                    ref: currentBranch,
                    inputs: {
                        locale: eachLocale
                    }
                }),
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28',
                    Authorization: 'Bearer ' + githubToken
                }
            }
        )
    }

    return new Response(null, { status: 200 })
}