'use client'

import { useEffect, useState } from 'react'
import { Select as AntdSelect, ConfigProvider } from 'antd'
import clsx from 'clsx'
import { IconChevronDown } from '@tabler/icons-react'
import { useTranslation } from 'shared/providers/i18nProvider'

export default function Select({ value, setValue, options: _options, width, height, fontColor, borderColor, className, children, ...props }: any) {
    const $ = useTranslation()
    const [options, setOptions] = useState(_options)
    useEffect(() => {
        setOptions(_options.map((option: any) => {
            return {
                ...option,
                label: $(option.name),
            }
        }))
    }, [$, _options])
    return (
        <ConfigProvider
            theme={{
                components: {
                    Select: {
                        controlHeight: height ? height : 38,
                        controlOutlineWidth: 0,
                        optionSelectedBg: '#DBDDF2',
                        optionActiveBg: '#DBDDF2',
                        controlOutline: 'none',
                        colorTextLabel: fontColor ? fontColor : '#001818',
                        colorBorder: borderColor ? borderColor : '#000000'
                    }
                }
            }}>
            <AntdSelect
                className={clsx(borderColor ? `border:${borderColor}!_.ant-select-selector` : 'border:#000000!_.ant-select-selector', width ? `w:${width}` : 'w:100%', className)}
                options={options}
                defaultValue={value}
                suffixIcon={<IconChevronDown size={16} stroke={3} color={'#001818'}/>}
                onChange={(value: any) => setValue(value)}
                {...props}
                labelRender={(props) => {
                    return <div>{$(props.label)}</div>
                }} />
        </ConfigProvider>
    )
}