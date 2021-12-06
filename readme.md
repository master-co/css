# Create
## 1. Naming your package
```bash
PACKAGE_NAME=
```
Please follow the naming conventions:
- css package: `xxx.css`
- util package: `xxx.util`
- pipe package: `xxx.pipe`

## 2. Choose and clone
### css package
```bash
git clone -b css https://github.com/master-style/package.git $PACKAGE_NAME
```
### js package
```bash
git clone -b js https://github.com/master-style/package.git $PACKAGE_NAME
```

### js & css package
```bash
git clone -b main https://github.com/master-style/package.git $PACKAGE_NAME
```

## 3. New a Github repository and configure remote
```bash
cd $PACKAGE_NAME

gh repo create master-style/$PACKAGE_NAME --public

git remote set-url origin https://github.com/master-style/$PACKAGE_NAME.git

git remote add package https://github.com/master-style/package.git
```