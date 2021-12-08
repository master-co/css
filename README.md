<br><br>
<p align="center">
    <img src="https://raw.githubusercontent.com/master-style/package/document/images/logo-and-text.svg" alt="logo" width="142">
</p>
<p align="center">
    <b>{{ PACKAGE_NAME }}</b>
</p>
<p align="center">{{ package.description }}</p>
<p align="center">
<a href="https://circleci.com/gh/{{ ORG_NAME }}/workflows/{{ PACKAGE_NAME }}/tree/main">
<img src="https://img.shields.io/circleci/build/github/{{ ORG_NAME }}/{{ PACKAGE_NAME }}/main.svg?logo=circleci&logoColor=fff&label=CircleCI" alt="CI status" />
</a>&nbsp;
<a href="https://www.npmjs.com/{{ package.name }}">
<img src="https://img.shields.io/npm/v/{{ package.name }}.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen" alt="Angular on npm" />
</a>&nbsp;
<a href="https://github.com/{{ ORG_NAME }}/{{ PACKAGE_NAME }}/blob/main/LICENSE"><img alt="GitHub license" src="https://img.shields.io/github/license/{{ ORG_NAME }}/{{ PACKAGE_NAME }}"></a>
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