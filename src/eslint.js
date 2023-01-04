import path from 'path';

export default async function eslint(
  {
    files, eslintConfigPath, eslintignorePath,
    githubWorkspace, customDirectory, title
  }
) {
  const { CLIEngine } = (
    await import(path.join(process.cwd(), customDirectory,
      'node_modules/eslint')).then((
      (module) => (
        module.default
      )
    ))
  );
  const cli = new CLIEngine({
    useEslintrc: false,
    configFile: path.join(githubWorkspace, eslintConfigPath),
    ignore: true,
    ignorePath: eslintignorePath,
    resolvePluginsRelativeTo: path.join(githubWorkspace, customDirectory, 'node_modules'),
    extensions: ['.js', '.jsx', '.tsx']
  });
  const report = cli.executeOnFiles(files);
  // fixableErrorCount, fixableWarningCount are available too
  const {results, errorCount, warningCount } = report;

  const levels = ['', 'warning', 'failure'];

  const annotations = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const result of results) {
    const { filePath, messages } = result;
    const path = filePath.substring(githubWorkspace.length + 1);
    // eslint-disable-next-line no-restricted-syntax
    for (const msg of messages) {
      const {
        line, severity,
        ruleId, message
      } = msg;
      const annotationLevel = levels[severity];
      if (!cli.isPathIgnored(filePath)) {
        // current limit is 50 annotations per request
        if (annotations.length >= 50) {
          break;
        }
        annotations.push({
          path,
          start_line: line,
          end_line: line,
          annotation_level: annotationLevel,
          message: `[${ruleId}] ${message}`
        });
      }
    }
  }
  return {
    conclusion: errorCount > 0 ? 'failure' : 'success',
    output: {
      title,
      summary: `${errorCount} error(s), ${warningCount} warning(s) found`,
      annotations
    }
  };
}
