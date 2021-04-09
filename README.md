# Embroider: translating existing Ember code into spec-compliant modern JavaScript

[![GitHub Actions CI][github-actions-badge]][github-actions-ci-url]

[github-actions-badge]: https://github.com/embroider-build/embroider/workflows/CI/badge.svg
[github-actions-ci-url]: https://github.com/embroider-build/embroider/actions?query=workflow%3ACI

This repo implements a new three-stage build system for Ember apps:

1. The first stage achieves backward compatibility by building each classic
   Ember Addon package into a new **v2 package format**. This makes each package
   much more static and analyzable. The eventual goal is to do less and less
   work in this stage, as addons publish to NPM natively in v2 format.

2. The second stage takes a collection of v2-formatted addons plus an
   application and "compiles out" all Ember-specific conventions, such that the
   output can be understood by any tool that can handle standards-compliant
   Javascript. This stage is setup with good inputs and outputs that make it
   much easier to benefit from incremental improvements to our dependency
   analysis. The immediate goal is not to implement every possible optimization,
   but rather to make a good place for those optimizations to happen.

3. The third stage ("final packaging") can be handled by existing tools like
   Webpack, Rollup, or Parcel with only a small amount of configuration. Not
   because we want to force every Ember developer to choose and configure one of
   these tools! But because a stable, standards-compliant API between stage 2
   and 3 improves our ability to innovate and experiment with taking the best
   parts of wider JS ecosystem tooling.

You can read more about the motivation and key ideas in the [intro to the SPEC](SPEC.md).

## Status / Should I Use It?

We are rapidly nearing a 1.0 release, and several large, heavily-tested Ember apps are shipping to production with Embroider. So if you are excited to adopt Embroider, it is a reasonable choice. The main risks to be aware of if you choose to use Embroider in production are:

- you're likely to discover some Ember addons don't work or break your build
- Embroider's own configuration options are subject to change, so you'll need
  to read the CHANGELOG.md when updating the Embroider packages.

Alternatively, it is totally safe to stick with the traditional build pipeline and wait for the official cutover point when EmberCLI starts generating new apps with Embroider by default.

## For Addon Authors

The [v2 Addon Format RFC](https://github.com/emberjs/rfcs/pull/507) is the official spec for the packages that Embroider natively handles. Addon authors should see [ADDON-AUTHOR-GUIDE.md](ADDON-AUTHOR-GUIDE.md) for advice on how to get their addons ready for Embroider.

## How to try it

1. Add dependencies:

   ```
   yarn add --dev @embroider/core @embroider/compat @embroider/webpack
   ```

2. Edit `ember-cli-build.js`:

   ```diff
   -return app.toTree();
   +const { Webpack } = require('@embroider/webpack');
   +return require('@embroider/compat').compatBuild(app, Webpack);
   ```

   Alternatively, if you are passing optional extra broccoli trees into
   `app.toTree()`, you can rewrite like:

   ```diff
   -return app.toTree(extraTreeHere);
   +const { Webpack } = require('@embroider/webpack');
   +return require('@embroider/compat').compatBuild(app, Webpack, {
   +  extraPublicTrees: [extraTreeHere]
   +});
   ```

3. Use `ember serve`, `ember test`, and `ember build` as usual.

## Options

You can pass options into Embroider by passing them into the `compatBuild` function like:

```js
return require('@embroider/compat').compatBuild(app, Webpack, {
  // staticAddonTestSupportTrees: true,
  // staticAddonTrees: true,
  // staticHelpers: true,
  // staticComponents: true,
  // splitAtRoutes: ['route.name'], // can also be a RegExp
  // packagerOptions: {
  //    webpackConfig: { }
  // }
});
```

The options are documented in detail in [Core Options](https://github.com/embroider-build/embroider/blob/master/packages/core/src/options.ts) and [Compat Options](https://github.com/embroider-build/embroider/blob/master/packages/compat/src/options.ts).

The recommended steps when introducing Embroider into an existing app are:

1. First make it work with no options. This is the mode that supports maximum backward compatibility.
2. Enable `staticAddonTestSupportTrees` and `staticAddonTrees` and test your application. This is usually safe, because most code in these trees gets consumed via `import` statements that we can analyze. But you might find exceptional cases where some code is doing a more dynamic thing.
3. Enable `staticHelpers` and test. This is usually safe because addons get invoke declarative in templates and we can see all invocations.
4. Enable `staticComponents`, and work to eliminate any resulting build warnings about dynamic component invocation. You may need to add `packageRules` that declare where invocations like `{{component someComponent}}` are getting `someComponent` from.
5. Once your app is working with all of the above, you can enable `splitAtRoutes` and add the `@embroider/router` and code splitting should work.

## Configuring asset URLs

If you are serving your assets from a different origin (like a CDN) from where your index.html content will
be served from, you can use the publicAssetURL option to specify the base URL. In pre-Embroider Ember apps,
this was accomplished by configuring the `fingerprint: { prepend: ... }` option handled by broccoli-asset-rev.

```js
return require('@embroider/compat').compatBuild(app, Webpack, {
  packagerOptions: {
    publicAssetURL: 'https://your-cdn-here.com/', // This should be a URL ending in "/"
  },
});
```

## Analyzing Bundles

see [`ANALYZING.md`](ANALYZING.md)

## Contributing

see [`CONTRIBUTING.md`](CONTRIBUTING.md)

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

Thanks to [Cardstack](https://github.com/cardstack) for sponsoring Embroider's development.
