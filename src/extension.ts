import * as vscode from 'vscode'
const fs = require('fs')
import { convertHexadecimal, basePath } from './utils'
import defaultTokenColors from './data/default_token_colors'

const scriptRegExp =
  /^.*(<!-- SYNTHWAVE 84 --><script src="neondreams.js".*?><\/script><!-- NEON DREAMS -->).*\n?/gm

// 将js写入neondreams
function writeJsInTemplate(
  brightness: string,
  tokenColors: any,
  disableGlow: boolean
) {
  return new Promise(resovle => {
    const templateFile = `${basePath}neondreams.js`
    // 读取插件文件
    const chromeStyles = fs.readFileSync(
      __dirname + '/editor_chrome.css',
      'utf-8'
    )
    const jsTemplate = fs.readFileSync(
      __dirname + '/theme_template.js',
      'utf-8'
    )

    // js文件进行替换
    const finalTheme = jsTemplate
      .replace(/\[TOKEN_COLORS\]/g, JSON.stringify(tokenColors))
      .replace(/\[NEON_BRIGHTNESS\]/g, brightness)
      .replace(/\[DISABLE_GLOW\]/g, disableGlow)
      .replace(/\[CHROME_STYLES\]/g, chromeStyles)

    // neondreamsjs 写入最终样式js
    fs.writeFileSync(templateFile, finalTheme, 'utf-8')
    resovle(undefined)
  })
}

// html中写入script
function writeScriptInHtml(htmlFile: string, html: string) {
  return new Promise(resolve => {
    let output = html.replace(scriptRegExp, '')
    output = html.replace(
      /\<\/html\>/g,
      `	<!-- SYNTHWAVE 84 --><script src="neondreams.js" async></script><!-- NEON DREAMS -->\n`
    )
    output += '</html>'

    fs.writeFileSync(htmlFile, output, 'utf-8')
    resolve(undefined)
  })
}

// 从html中删除script
function deleteScriptInHtml(htmlFile: string, html: string) {
  return new Promise(resolve => {
    let output = html.replace(scriptRegExp, '')
    fs.writeFileSync(htmlFile, output, 'utf-8')

    resolve(undefined)
  })
}

// 获取html的相关信息
function getHtmlInfo() {
  const htmlFile = `${basePath}workbench.html`
  const html = fs.readFileSync(htmlFile, 'utf-8')
  const isEnabled = html.includes('neondreams.js')
  return { isEnabled, htmlFile, html }
}

// 获取配置
function getCinfiguration() {
  let { brightness, tokenColors, disableGlow } =
    vscode.workspace.getConfiguration('Andromeda84')

  // 是否禁用
  disableGlow = !!disableGlow
  // 配置项
  brightness = convertHexadecimal(brightness)

  // 颜色
  tokenColors = Object.keys(tokenColors).length
    ? { ...defaultTokenColors, ...tokenColors }
    : defaultTokenColors

  return {
    brightness,
    tokenColors,
    disableGlow,
  }
}

export function activate(context: vscode.ExtensionContext) {
  let enableNeon = vscode.commands.registerCommand(
    'Andromeda84.enableNeon',
    async () => {
      const { brightness, tokenColors, disableGlow } = getCinfiguration()

      await writeJsInTemplate(brightness, tokenColors, disableGlow)

      const { isEnabled, htmlFile, html } = getHtmlInfo()

      if (!isEnabled) {
        try {
          await writeScriptInHtml(htmlFile, html)
        } catch (error: any) {
          if (/ENOENT|EACCES|EPERM/.test(error.code)) {
            vscode.window.showInformationMessage(
              '你必须以管理员权限运行vscode才能启用'
            )
            return
          }
        }
        vscode.window
          .showInformationMessage(
            '开启霓虹灯。必须重新加载vscode才能使此更改生效。代码可能会显示已损坏的警告，这是正常的。您可以通过在通知上选择“不再显示此消息”来取消此消息。',
            { title: '请重启vscode' }
          )
          .then(function (msg) {
            vscode.commands.executeCommand('workbench.action.reloadWindow')
          })
      } else {
        vscode.window
          .showInformationMessage('霓虹灯已经启用。重新加载以刷新JS设置。', {
            title: '请重启vscode',
          })
          .then(function (msg) {
            vscode.commands.executeCommand('workbench.action.reloadWindow')
          })
      }
    }
  )

  let disableNeon = vscode.commands.registerCommand(
    'Andromeda84.disableNeon',
    async () => {
      const { isEnabled, htmlFile, html } = getHtmlInfo()

      if (isEnabled) {
        await deleteScriptInHtml(htmlFile, html)
        vscode.window
          .showInformationMessage(
            '霓虹灯已禁用。必须重新加载vscode才能使此更改生效',
            { title: '请重启vscode' }
          )
          .then(function (msg) {
            vscode.commands.executeCommand('workbench.action.reloadWindow')
          })
      } else {
        vscode.window
          .showInformationMessage('霓虹灯已经禁用', { title: '请重启vscode' })
          .then(function (msg) {
            vscode.commands.executeCommand('workbench.action.reloadWindow')
          })
      }
    }
  )

  context.subscriptions.push(enableNeon)
  context.subscriptions.push(disableNeon)
}

export function deactivate() {}
