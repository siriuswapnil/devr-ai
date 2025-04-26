import * as vscode from 'vscode';
import * as fs from 'fs';
import * as yaml from 'yaml';

// Define an interface for the OpenAPI operation
interface OpenAPIOperation {
  operationId?: string;
  [key: string]: any;
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('apiIntegrator.integrateApi', async () => {
    // 1. Show API selection
    const api = await vscode.window.showQuickPick([
      { label: 'Stripe Payments', description: 'Integrate Stripe payment APIs' },
      { label: 'Novu Notifications', description: 'Integrate Novu notification APIs' },
      { label: 'Generate from API Documentation', description: 'Paste an API documentation link to auto-generate a client' }
    ], {
      placeHolder: 'Select an API to integrate'
    });
    if (!api) {
      return;
    }

    // Handle new option: Generate from API Documentation
    if (api.label === 'Generate from API Documentation' || api.label === 'Stripe Payments') {
      const docUrl = api.label === 'Generate from API Documentation'
        ? await vscode.window.showInputBox({
            prompt: 'Enter the API documentation URL (OpenAPI/Swagger preferred)',
            ignoreFocusOut: true
          })
        : 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.yaml';
      if (!docUrl) {
        vscode.window.showWarningMessage('No documentation URL provided.');
        return;
      }
      try {
        const fetch = require('node-fetch');
        const res = await fetch(docUrl);
        if (!res.ok) throw new Error('Failed to fetch documentation.');
        let apiDoc;
        if (docUrl.endsWith('.yaml') || docUrl.endsWith('.yml')) {
          const text = await res.text();
          apiDoc = yaml.parse(text);
        } else {
          apiDoc = await res.json();
        }
        // Generate client code for all endpoints
        let clientCode = '// Auto-generated API client\n';
        if (apiDoc.paths) {
          for (const [path, methods] of Object.entries(apiDoc.paths)) {
            for (const [method, op] of Object.entries(methods as Record<string, OpenAPIOperation>)) {
              const funcName = op.operationId || `${method}${path.replace(/\W+/g, '_')}`;
              clientCode += `export async function ${funcName}(params: any) {\n  // TODO: Implement call to ${method.toUpperCase()} ${path}\n}\n\n`;
            }
          }
        } else {
          clientCode += '// Could not parse endpoints from documentation.';
        }
        // Ensure /services exists
        const wsFolders = vscode.workspace.workspaceFolders;
        if (!wsFolders) {
          vscode.window.showErrorMessage('No workspace folder open.');
          return;
        }
        const servicesUri = vscode.Uri.joinPath(wsFolders[0].uri, 'services');
        try {
          await vscode.workspace.fs.readDirectory(servicesUri);
        } catch (e) {
          await vscode.workspace.fs.createDirectory(servicesUri);
        }
        // Write the generated client code to a file
        const clientFileName = api.label === 'Stripe Payments' ? 'stripeService.ts' : 'apiClient.ts';
        const clientFileUri = vscode.Uri.joinPath(servicesUri, clientFileName);
        await vscode.workspace.fs.writeFile(clientFileUri, Buffer.from(clientCode, 'utf8'));
        vscode.window.showInformationMessage(`${clientFileName} generated successfully!`);
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to generate client: ${err}`);
      }
      return;
    }

    // 2. Prompt for API key/config
    let configKey = '';
    let scaffoldCode = '';
    if (api.label === 'Stripe Payments') {
      configKey = await vscode.window.showInputBox({
        prompt: 'Enter your Stripe secret key',
        ignoreFocusOut: true,
        password: true
      }) || '';
      scaffoldCode = `// Stripe integration scaffold\nconst stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);\n// TODO: Add your Stripe logic here\n`;
    } else if (api.label === 'Novu Notifications') {
      configKey = await vscode.window.showInputBox({
        prompt: 'Enter your Novu API key',
        ignoreFocusOut: true,
        password: true
      }) || '';
      // Scaffold a comprehensive Novu API client with all documented endpoints
      scaffoldCode = `// Novu REST API Client\nconst NOVU_API_URL = 'https://api.novu.co/v1';\nconst NOVU_API_KEY = process.env.NOVU_API_KEY;\n\nasync function novuFetch(endpoint, options = {}) {\n  return fetch(NOVU_API_URL + endpoint, {\n    ...options,\n    headers: {\n      'Authorization': \`ApiKey \${NOVU_API_KEY}\` ,\n      'Content-Type': 'application/json',\n      ...(options.headers || {})\n    }\n  });\n}\n\n// EVENTS\nexport async function triggerEvent(data) {\n  return novuFetch('/events/trigger', { method: 'POST', body: JSON.stringify(data) });\n}\nexport async function broadcastEvent(data) {\n  return novuFetch('/events/broadcast', { method: 'POST', body: JSON.stringify(data) });\n}\n\n// NOTIFICATIONS\nexport async function getNotifications(query = '') {\n  return novuFetch(\`/notifications\${query ? '?' + query : ''}\`);\n}\nexport async function getNotification(notificationId) {\n  return novuFetch(\`/notifications/\${notificationId}\`);\n}\n\n// TENANTS\nexport async function getTenants() {\n  return novuFetch('/tenants');\n}\nexport async function createTenant(tenant) {\n  return novuFetch('/tenants', { method: 'POST', body: JSON.stringify(tenant) });\n}\nexport async function getTenant(identifier) {\n  return novuFetch(\`/tenants/\${identifier}\`);\n}\nexport async function updateTenant(identifier, update) {\n  return novuFetch(\`/tenants/\${identifier}\`, { method: 'PATCH', body: JSON.stringify(update) });\n}\nexport async function deleteTenant(identifier) {\n  return novuFetch(\`/tenants/\${identifier}\`, { method: 'DELETE' });\n}\n\n// SUBSCRIBERS\nexport async function getSubscribers() {\n  return novuFetch('/subscribers');\n}\nexport async function createSubscriber(subscriber) {\n  return novuFetch('/subscribers', { method: 'POST', body: JSON.stringify(subscriber) });\n}\nexport async function getSubscriber(subscriberId) {\n  return novuFetch(\`/subscribers/\${subscriberId}\`);\n}\nexport async function updateSubscriber(subscriberId, update) {\n  return novuFetch(\`/subscribers/\${subscriberId}\`, { method: 'PATCH', body: JSON.stringify(update) });\n}\nexport async function deleteSubscriber(subscriberId) {\n  return novuFetch(\`/subscribers/\${subscriberId}\`, { method: 'DELETE' });\n}\n\n// ENVIRONMENTS\nexport async function getEnvironments() {\n  return novuFetch('/environments');\n}\nexport async function updateEnvironment(environmentId, update) {\n  return novuFetch(\`/environments/\${environmentId}\`, { method: 'PATCH', body: JSON.stringify(update) });\n}\n\n// CHANGES\nexport async function getChanges() {\n  return novuFetch('/changes');\n}\nexport async function getChange(changeId) {\n  return novuFetch(\`/changes/\${changeId}\`);\n}\n\n// Add more endpoints as needed, following the Novu API Reference\n`;
    }

    if (!configKey) {
      vscode.window.showWarningMessage('No API key provided. Integration cancelled.');
      return;
    }

    // 3. Write to .env and scaffold file
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }
    const rootPath = wsFolders[0].uri.fsPath;
    const envPath = vscode.Uri.joinPath(wsFolders[0].uri, '.env');
    let envVar = '';
    if (api.label === 'Stripe Payments') {
      envVar = `STRIPE_SECRET_KEY=${configKey}`;
    } else if (api.label === 'Novu Notifications') {
      envVar = `NOVU_API_KEY=${configKey}`;
    }
    // Append or create .env
    try {
      let envContent = '';
      try {
        const existing = await vscode.workspace.fs.readFile(envPath);
        envContent = Buffer.from(existing).toString('utf8');
        if (!envContent.includes(envVar.split('=')[0])) {
          envContent += `\n${envVar}`;
          await vscode.workspace.fs.writeFile(envPath, Buffer.from(envContent));
        }
      } catch (e) {
        // .env does not exist
        await vscode.workspace.fs.writeFile(envPath, Buffer.from(envVar + '\n'));
      }
      vscode.window.showInformationMessage(`API key saved to .env as ${envVar.split('=')[0]}`);
    } catch (e) {
      vscode.window.showErrorMessage('Failed to write to .env: ' + e);
      return;
    }

    // 4. Scaffold integration file
    // Ensure /services exists in user workspace
    const servicesUri = vscode.Uri.joinPath(wsFolders[0].uri, 'services');
    try {
      await vscode.workspace.fs.readDirectory(servicesUri);
    } catch (e) {
      // Folder does not exist, create it
      await vscode.workspace.fs.createDirectory(servicesUri);
    }
    // Copy the service template from extension's src/templates
    const apiServiceFile = api.label === 'Stripe Payments' ? 'stripeService.ts' : 'novuService.ts';
    const extension = vscode.extensions.getExtension('your-name.vscode-api-integrator');
    let templatePath = '';
    if (extension) {
      templatePath = vscode.Uri.joinPath(extension.extensionUri, 'out', '..', 'src', 'templates', apiServiceFile).fsPath;
    } else {
      vscode.window.showErrorMessage('Could not locate extension templates.');
      return;
    }
    const userServiceUri = vscode.Uri.joinPath(servicesUri, apiServiceFile);
    try {
      // Only copy if not already present
      await vscode.workspace.fs.stat(userServiceUri);
      vscode.window.showInformationMessage(`${apiServiceFile} already exists in your project.`);
    } catch {
      // Copy template
      if (fs.existsSync(templatePath)) {
        const content = fs.readFileSync(templatePath, 'utf8');
        await vscode.workspace.fs.writeFile(userServiceUri, Buffer.from(content));
        vscode.window.showInformationMessage(`Created ${apiServiceFile} in your services/ folder.`);
      } else {
        vscode.window.showErrorMessage('Template file not found in extension.');
      }
    }

    // 5. Scaffold integration usage file (legacy, can be removed if not needed)
    const scaffoldFileName = api.label === 'Stripe Payments' ? 'stripe-integration.js' : 'novu-integration.js';
    const scaffoldUri = vscode.Uri.joinPath(wsFolders[0].uri, scaffoldFileName);
    try {
      await vscode.workspace.fs.writeFile(scaffoldUri, Buffer.from(scaffoldCode));
      vscode.window.showInformationMessage(`Created ${scaffoldFileName} in your project.`);
    } catch (e) {
      vscode.window.showErrorMessage('Failed to create integration file: ' + e);
    }
  });

  // New command: Insert API Endpoint Call
  let insertApiDisposable = vscode.commands.registerCommand('apiIntegrator.insertApiEndpoint', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor.');
      return;
    }
    const doc = editor.document;
    if (!['typescript', 'javascript'].includes(doc.languageId)) {
      vscode.window.showWarningMessage('This command works only in TypeScript or JavaScript files.');
      return;
    }

    // 1. Scan for available APIs in services/
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }
    const servicesUri = vscode.Uri.joinPath(wsFolders[0].uri, 'services');
    let apiFiles: vscode.Uri[] = [];
    try {
      apiFiles = (await vscode.workspace.fs.readDirectory(servicesUri))
        .filter(([name, type]) => name.endsWith('Service.ts') && type === vscode.FileType.File)
        .map(([name]) => vscode.Uri.joinPath(servicesUri, name));
    } catch (e) {
      vscode.window.showErrorMessage('Could not find services/ folder.');
      return;
    }
    if (apiFiles.length === 0) {
      vscode.window.showWarningMessage('No API service files found in services/.');
      return;
    }

    // 2. Ask user which API
    const apiChoices = apiFiles.map(uri => {
      const match = uri.path.match(/\/([\w]+)Service\.ts$/);
      return {
        label: match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : uri.path,
        uri
      };
    });
    const apiPick = await vscode.window.showQuickPick(apiChoices, { placeHolder: 'Select an API service' });
    if (!apiPick) return;

    // 3. Parse exported functions from the service file
    let fileContent = '';
    try {
      const bytes = await vscode.workspace.fs.readFile(apiPick.uri);
      fileContent = Buffer.from(bytes).toString('utf8');
    } catch (e) {
      vscode.window.showErrorMessage('Failed to read service file.');
      return;
    }
    // Simple regex: export async function funcName(
    const funcRegex = /export\s+(?:async\s+)?function\s+(\w+)\s*\(/g;
    let match;
    const functions: string[] = [];
    while ((match = funcRegex.exec(fileContent))) {
      functions.push(match[1]);
    }
    if (functions.length === 0) {
      vscode.window.showWarningMessage('No exported functions found in this service file.');
      return;
    }

    // 4. Ask user which function
    const funcPick = await vscode.window.showQuickPick(functions, { placeHolder: 'Select endpoint function' });
    if (!funcPick) return;

    // 5. Ask if dummy parameters should be included
    const dummyParams = await vscode.window.showQuickPick([
      { label: 'Yes', description: 'Insert with dummy parameters' },
      { label: 'No', description: 'Insert empty call' }
    ], { placeHolder: 'Prefill with dummy parameters?' });
    if (!dummyParams) return;

    // 6. Insert function call at cursor
    const importPath = `services/${apiPick.label.toLowerCase()}Service`;
    const callSnippet = dummyParams.label === 'Yes'
      ? `await ${funcPick}(/* params */);\n`
      : `await ${funcPick}();\n`;
    await editor.edit(editBuilder => {
      editBuilder.insert(editor.selection.active, callSnippet);
    });

    // 7. Add import if not present
    const importStatement = `import { ${funcPick} } from '${importPath}';`;
    const text = doc.getText();
    if (!text.includes(importStatement)) {
      // Insert at top (after any existing imports)
      const importRegex = /^(import .+;\s*)+/m;
      const match = importRegex.exec(text);
      let pos: vscode.Position;
      if (match) {
        const lastImport = text.lastIndexOf('import');
        pos = doc.positionAt(lastImport + match[0].length);
      } else {
        pos = new vscode.Position(0, 0);
      }
      const workspaceEdit = new vscode.WorkspaceEdit();
      workspaceEdit.insert(doc.uri, pos, importStatement + '\n');
      await vscode.workspace.applyEdit(workspaceEdit);
    }
    vscode.window.showInformationMessage(`Inserted call to ${funcPick} from ${apiPick.label} service.`);
  });

  context.subscriptions.push(disposable);
  context.subscriptions.push(insertApiDisposable);
}

export function deactivate() {}
