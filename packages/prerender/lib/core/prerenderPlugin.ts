import HtmlWebpackPlugin from 'html-webpack-plugin'
import webpack, { Compiler } from 'webpack'
import { addScriptTag } from '../utils'
import log from '../log/index'
import { initMediator, RENDER, SERVER } from './init'
import { defaultOptions, getFreePort, getLocalIpAddress } from '../config'
import { initMemoryFileSystem } from '../utils/MemoryFileSystem'
import merge from 'lodash/merge'
import fs from 'fs'
import path from 'path'
/**
 * @internal
 */
const PLUGIN_NAME = 'prerenderPlugin'
/**
 * @internal
 */
const EVENT_LIST =
  process.env.NODE_ENV === 'production'
    ? ['watchClose', 'failed', 'done']
    : ['watchClose', 'failed']
/**
 * @internal
 */
interface HtmlPluginData {
  html?: string
  outputName: string
  plugin: HtmlWebpackPlugin
}
class PrerenderPlugin {
  /**
   * @internal
   */
  option: Options | undefined = undefined

  /**
   * @internal
   */
  constructor(option: Options = {}) {
    this.option = option
  }

  /**
   * @internal
   */
  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      const htmlWebpackPlugin = (compiler.options.plugins as webpack.Plugin[])
        .map(({ constructor }) => constructor)
        .find(({ name }) => name === 'HtmlWebpackPlugin')
      if (htmlWebpackPlugin) {
        if (compiler.hooks) {
          const htmlWebpackPluginBeforeHtmlProcessing =
            // @ts-ignore
            compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing ||
            // @ts-ignore
            htmlWebpackPlugin.getHooks(compilation).beforeEmit
          htmlWebpackPluginBeforeHtmlProcessing.tapAsync(
            PLUGIN_NAME,
            async (htmlPluginData: HtmlPluginData, callback: Function) => {
              await this.init(this.option)
              // if (process.env.NODE_ENV !== 'production') {
              htmlPluginData = this.injectJs(htmlPluginData)
              // }
              callback(null, htmlPluginData)
            }
          )
        }
      }
    })
    compiler.hooks.afterEmit.tapAsync(PLUGIN_NAME, async (_compilation, callback: any) => {
      if (process.env.NODE_ENV === 'production') {
        await this.outputSkeletonScreen()
        callback()
      }
    })
    EVENT_LIST.forEach(event => {
      // @ts-ignore
      compiler.hooks[event].tap(PLUGIN_NAME, () => {
        if (SERVER) {
          SERVER.destroy()
        }
      })
    })
  }

  /**
   * @internal
   */
  private async init(option: Options = {}): Promise<void> {
    try {
      const host = await getLocalIpAddress()
      const port = await getFreePort()
      const mergeOption = merge({ host, port }, defaultOptions, option)
      this.option = mergeOption
      await initMediator(this.option)
      initMemoryFileSystem()
    } catch (error) {
      log.error(error)
    }
  }

  /**
   * @internal
   */
  private injectJs(htmlPluginData: HtmlPluginData): HtmlPluginData {
    const script = fs.readFileSync(path.join(__dirname, '../sock/sock_client.bundle.js'))
    const oldHtml = htmlPluginData.html
    htmlPluginData.html = addScriptTag(
      oldHtml as string,
      script.toString(),
      this?.option?.port ?? 8888
    )
    return htmlPluginData
  }

  /**
   * @internal
   */
  private async outputSkeletonScreen() {
    await RENDER?.outputScreen()
  }
}

export default PrerenderPlugin
