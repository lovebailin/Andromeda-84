import * as vscode from 'vscode'
const fs = require('fs')
const path = require('path')
import { convertHexadecimal, basePath } from './utils'

// 将js写入neondreams
function writeJsInTemplate(disableGlow: boolean, brightness: string) {
  return new Promise((resovle, reject) => {
    const templateFile = `${basePath}neondreams.js`
    // 读取插件文件
    const chromeStyles = fs.readFileSync(
      path.dirname(__dirname) + '/src/css/editor_chrome.css',
      'utf-8'
    )
    const jsTemplate = fs.readFileSync(
      path.dirname(__dirname) + '/src/js/theme_template.js',
      'utf-8'
    )

    console.log(disableGlow, brightness)

    // js文件进行替换
    const finalTheme = jsTemplate
      .replace(/\[DISABLE_GLOW\]/g, disableGlow)
      .replace(/\[NEON_BRIGHTNESS\]/g, brightness)
      .replace(/\[CHROME_STYLES\]/g, chromeStyles)

    // neondreamsjs 写入最终样式js
    fs.writeFileSync(templateFile, finalTheme, 'utf-8')
    resovle(undefined)
  })
}

// html中写入script
function writeScriptInHtml(htmlFile: string, html: string) {
  return new Promise((resolve, reject) => {
    let output = html.replace(
      /^.*(<!-- Andromeda84 --><script src="neondreams.js"><\/script><!-- NEON DREAMS -->).*\n?/gm,
      ''
    )
    output = html.replace(
      /\<\/html\>/g,
      `	<!-- SYNTHWAVE 84 --><script src="neondreams.js"></script><!-- NEON DREAMS -->\n`
    )
    output += '</html>'

    fs.writeFileSync(htmlFile, output, 'utf-8')
    resolve(undefined)
  })
}

// 从html中删除script
function deleteScriptInHtml(htmlFile: string, html: string) {
  return new Promise((resolve, reject) => {
    let output = html.replace(
      /^.*(<!-- SYNTHWAVE 84 --><script src="neondreams.js"><\/script><!-- NEON DREAMS -->).*\n?/gm,
      ''
    )
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

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "andromeda-84" is now active!')

  let { brightness, disableGlow } =
    vscode.workspace.getConfiguration('Andromeda84')

  // 配置项
  disableGlow = !!disableGlow
  brightness = convertHexadecimal(brightness)

  let enableNeon = vscode.commands.registerCommand(
    'Andromeda84.enableNeon',
    async () => {
      await writeJsInTemplate(disableGlow, brightness)

      const { isEnabled, htmlFile, html } = getHtmlInfo()

      if (!isEnabled) {
        await writeScriptInHtml(htmlFile, html)
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
      console.log(isEnabled, htmlFile, html)

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
        vscode.window.showInformationMessage('霓虹灯正在运行')
      }
    }
  )

  context.subscriptions.push(enableNeon)
  context.subscriptions.push(disableNeon)
}

export function deactivate() {}
