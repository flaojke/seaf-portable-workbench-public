export const SEAF_INDEX_FILE_NAME = 'seaf.yaml';
export const DOCHUB_INDEX_FILE_NAME = 'dochub.yaml';
export const BITBUCKET_URI_PREFIX = 'bitbucket:';
export const GITLAB_URI_PREFIX = 'gitlab:';

/**
 * Разделитель repository+branch и пути к файлу для путей по формату git (bitbucket/gitlab),
 * например 'bitbucket:myproject:myrepo:mybranch@dochub.yaml' или 'gitlab:34:main@root.yaml'
 * (см. описание форматов в example.env).
 */
export const GIT_ROOT_URI_SEPARATOR = '@';
