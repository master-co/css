<br><br>
<p align="center">
    <img src="https://raw.githubusercontent.com/master-style/package/document/images/logo-and-text.svg" alt="logo" width="142">
</p>
<p align="center">
    <b>{{ name }}</b>
</p>
<p align="center">{{ package.description }}</p>
<p align="center">
<a href="https://circleci.com/gh/{{ github.orgName }}/workflows/{{ github.orgName }}/tree/main">
<img src="https://img.shields.io/circleci/build/github/{{ github.orgName }}/{{ name }}/main.svg?logo=circleci&logoColor=fff&label=CircleCI" alt="CI status" />
</a>&nbsp;
<a href="https://www.npmjs.com/{{ package.name }}">
<img src="https://img.shields.io/npm/v/{{ package.name }}.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen" alt="Angular on npm" />
</a>&nbsp;
<a href="https://github.com/{{ github.orgName }}/{{ name }}/blob/main/LICENSE"><img alt="GitHub license" src="https://img.shields.io/github/license/{{ github.orgName }}/{{ name }}"></a>
</p>

###### CONTENTS
- [Install](#install)
  - [CDN](#cdn)
- [Usage](#usage)

# Install
```sh
npm install {{ package.name }}
```
## CDN
- [jsdelivr](https://www.jsdelivr.com/package/npm/{{ package.name }})
- [unpkg](https://unpkg.com/{{ package.name }})

# Usage