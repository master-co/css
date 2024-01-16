import getCurrentGitBranch from 'current-git-branch'
import githubToken from 'websites/tokens/github'

const currentBranch = getCurrentGitBranch()

export async function POST(req: Request) {
    const locale = new URL(req.url).searchParams.get('locale')
    if (!locale)
        return new Response(null, { status: 200 })

    fetch(
        `https://api.github.com/repos/${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}/actions/workflows/generate-page-cache.yml/dispatches`,
        {
            method: 'POST',
            body: JSON.stringify({
                ref: currentBranch,
                inputs: {
                    locale: locale
                }
            }),
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
                Authorization: 'Bearer ' + githubToken
            }
        }
    )

    return new Response(null, { status: 200 })
}