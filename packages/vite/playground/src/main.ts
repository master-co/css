import config from 'virtual:master-css-config'

// if config is not found, show alert
if (!config) {
    alert('No master.css config found')
} else {
    console.log('Master CSS config:', config)
}
