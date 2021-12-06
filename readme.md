# Create
## 1. Naming your package
```properties
PACKAGE_NAME=
```
Please follow the naming conventions:
- CSS Package: `name.css`
- Util Package: `name.util`
- Pipe Package: `name.pipe`

## 2. Choose and clone
### 📦 Standard Package ( CSS & JS )
```sh
git clone -b standard https://github.com/master-style/package.git $PACKAGE_NAME
```
### 📦 CSS Package
```sh
git clone -b css https://github.com/master-style/package.git $PACKAGE_NAME
```
### 📦 JS Package
```sh
git clone -b js https://github.com/master-style/package.git $PACKAGE_NAME
```

## 3. New a Github repository and configure remote
[Github CLI Installation | Github](https://github.com/cli/cli#installation)
```sh
cd $PACKAGE_NAME
gh repo create master-style/$PACKAGE_NAME --public
git remote remove origin
git remote add origin https://github.com/master-style/$PACKAGE_NAME.git
git remote add package https://github.com/master-style/package.git
git checkout -b main
```