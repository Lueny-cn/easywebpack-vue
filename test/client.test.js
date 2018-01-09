'use strict';
const expect = require('chai').expect;
const easywebpack = require('easywebpack');
const webpack = easywebpack.webpack;
const merge = easywebpack.merge;
const WebpackClientBuilder = require('../lib/client');
const path = require('path').posix;

// http://chaijs.com/api/bdd/
function createBuilder(config) {
  const builder = new WebpackClientBuilder(merge({
    entry: {
      include: path.join(__dirname)
    }
  }, config));
  if (config && config.type) {
    builder.type = config.type;
  }
  builder.setBuildPath(path.join(__dirname, 'dist/client'));
  builder.setPublicPath('/public');
  return builder;
}

function getLoaderByName(name, rules) {
  const loaderName = `${name}-loader`;
  return rules.find(rule => {
    return rule.use.some(loader => {
      return loaderName === loader || (typeof loader === 'object' && loader.loader === loaderName);
    });
  });
}

function getPluginByLabel(label, plugins) {
  return plugins.find(plugin => {
    return plugin.__lable__ === label || plugin.__plugin__ === 'html-webpack-plugin';
  });
}

describe('client.test.js', () => {
  before(() => {
  });

  after(() => {
  });

  beforeEach(() => {
  });

  afterEach(() => {
  });

  describe('#webpack framework test', () => {
    it('should vue framework merge test', () => {
      const vueLoaderConfig = {
        vue: {
          test: /\.vue$/,
          exclude: /node_modules/,
          use() {
            return [
              {
                loader: 'vue-loader',
                options: this.createFrameworkLoader('vue-style-loader')
              }
            ];
          }
        },
        vuehtml: {
          test: /\.html$/,
          use: ['vue-html-loader']
        }
      };
      const builder = createBuilder({});
      builder.mergeLoader(vueLoaderConfig);
      const webpackConfig = builder.create();
      const rules = webpackConfig.module.rules;
      const vueLoader = getLoaderByName('vue', rules);
      const vuehtml = getLoaderByName('vue-html', rules);
      expect(vueLoader.use[0].loader).to.equal('vue-loader');
      expect(vueLoader.use[0].options).to.include.all.keys(['preLoaders', 'loaders']);
      expect(vuehtml.use[0].loader).to.equal('vue-html-loader');
    });

    it('should egg test', () => {
      const builder = createBuilder({ egg: true });
      expect(builder.config.proxy).to.true;
    });
  });

  describe('#webpack hook test', () => {
    it('should create test', () => {
      const builder = createBuilder({
        create(){
          this.addEntry('configloader', path.join(__dirname, '../config/loader.js'));
        },
        onClient(){
          this.addEntry('configplugin', path.join(__dirname, '../config/plugin.js'));
        }
      });
      const webpackConfig = builder.create();
      expect(webpackConfig.entry).to.include.keys(['client.test', 'configloader', 'configplugin']);
    });
  });

  describe('#webpack client dev test', () => {
    it('should dev hot test', () => {
      const builder = createBuilder({ env: 'dev', log: true });
      const webpackConfig = builder.create();
      expect(webpackConfig.entry['client.test'].length).to.equal(2);
      expect(webpackConfig.entry['server.test'].length).to.equal(2);
    });
    it('should html test', () => {
      const builder = createBuilder({
        entry: {
          template: path.join(__dirname, 'layout.html')
        }
      });
      const webpackConfig = builder.create();
      const html = webpackConfig.plugins.filter(plugin => {
        return plugin.__plugin__ === 'html-webpack-plugin';
      });
      expect(html.length).to.equal(Object.keys(webpackConfig.entry).length);
    });
  });

  describe('#webpack publicPath test', () => {
    const cdnUrl = 'http://easywebpack.cn/public';
    it('should dev cdn config test', () => {
      const builder = createBuilder({ debug: true, env: 'dev', cdn: { url: cdnUrl} });
      const webpackConfig = builder.create();
      expect(webpackConfig.output.publicPath).to.equal(cdnUrl + '/');
    });
    it('should dev cdn dynamicDir config test', () => {
      const builder = createBuilder({ debug: true, env: 'dev', cdn: { url: cdnUrl, dynamicDir: 'cdn'} });
      const webpackConfig = builder.create();
      expect(webpackConfig.output.publicPath).to.equal(cdnUrl + '/cdn/');
    });
    it('should dev cdn config test', () => {
      const builder = createBuilder({ debug: true, env: 'dev', cdn: { url: cdnUrl} });
      const webpackConfig = builder.create();
      expect(webpackConfig.output.publicPath).to.equal(cdnUrl + '/');
    });

    it('should dev publicPath abspath config test', () => {
      const builder = createBuilder({ debug: true, env: 'dev', publicPath: cdnUrl });
      const webpackConfig = builder.create();
      expect(webpackConfig.output.publicPath).to.equal(cdnUrl + '/');
    });
    
    it('should dev publicPath config test', () => {
      const builder = createBuilder({ debug: true, env: 'dev', publicPath: '/static' });
      const webpackConfig = builder.create();
      expect(webpackConfig.output.publicPath).to.equal(builder.host + '/static/');
    });

    it('should dev publicPath useHost false config test', () => {
      const builder = createBuilder({ debug: true, env: 'dev', publicPath: '/static', useHost: false });
      const webpackConfig = builder.create();
      expect(webpackConfig.output.publicPath).to.equal('/static/');
    });

    it('should dev publicPath default env prod config test', () => {
      const builder = createBuilder({ debug: true, env: 'test' });
      const webpackConfig = builder.create();
      expect(webpackConfig.output.publicPath).to.equal('/public/');
    });

    it('should dev publicPath env test config test', () => {
      const builder = createBuilder({ debug: true, env: 'test', publicPath: '/static' });
      const webpackConfig = builder.create();
      expect(webpackConfig.output.publicPath).to.equal('/static/');
    });
  });

  describe('#webpack commonsChunk test', () => {
    it('should dev cdn config test', () => {
      const builder = createBuilder({ env: 'dev', lib: ['mocha'] });
      const webpackConfig = builder.create();
      const commonsChunks = webpackConfig.plugins.filter(plugin =>{
        return plugin.constructor.name === 'CommonsChunkPlugin';
      });
      expect(webpackConfig.entry).to.have.property('common');
      expect(commonsChunks.length).to.equal(2);
    });
  });

  describe('#webpack server plugins test', () => {
    it('should diable vue ssr dynamic plugin config test', () => {
      const builder = createBuilder({});
      const webpackConfig = builder.create();
      const ssrchunk = getPluginByLabel('vuessrchunk',webpackConfig.plugins);
      expect(ssrchunk).to.be.undefined;
    });
  });
});