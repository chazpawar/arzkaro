import { registerRootComponent } from 'expo';
import App from './src/App';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

registerRootComponent(App);
