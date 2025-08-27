<script lang="ts">
  import * as Collapsible from "$lib/components/ui/collapsible/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import { page } from '$app/stores';
  import { 
    isNavigationItemActive, 
    isSubItemActive, 
    getNavigationAriaAttributes,
    announceNavigationChange 
  } from '$lib/utils/navigation';
  
  let {
    items,
  }: {
    items: {
      title: string;
      url: string;
      // this should be `Component` after @lucide/svelte updates types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      icon?: any;
      isActive?: boolean;
      items?: {
        title: string;
        url: string;
      }[];
    }[];
  } = $props();

  // Function to check if a navigation item is active
  function isItemActive(item: typeof items[0]): boolean {
    return isNavigationItemActive(item, $page.url.pathname);
  }

  // Function to check if a sub-item is active
  function isSubItemActiveLocal(subItem: { title: string; url: string }): boolean {
    return isSubItemActive(subItem, $page.url.pathname);
  }

  // Handle navigation clicks with announcements
  function handleNavigationClick(title: string) {
    announceNavigationChange(`Navigating to ${title}`);
  }

  // Enhanced keyboard navigation
  function handleMainItemKeydown(event: KeyboardEvent, item: typeof items[0]) {
    const currentElement = event.currentTarget as HTMLElement;
    const menuItems = currentElement.closest('[role="navigation"]')?.querySelectorAll('[role="button"]');
    
    if (!menuItems) return;
    
    const currentIndex = Array.from(menuItems).indexOf(currentElement);
    
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        currentElement.click();
        handleNavigationClick(item.title);
        break;
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % menuItems.length;
        (menuItems[nextIndex] as HTMLElement).focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
        (menuItems[prevIndex] as HTMLElement).focus();
        break;
      case 'Home':
        event.preventDefault();
        (menuItems[0] as HTMLElement).focus();
        break;
      case 'End':
        event.preventDefault();
        (menuItems[menuItems.length - 1] as HTMLElement).focus();
        break;
    }
  }

  function handleSubItemKeydown(event: KeyboardEvent, subItem: { title: string; url: string }) {
    const currentElement = event.currentTarget as HTMLElement;
    const subMenuItems = currentElement.closest('[role="menu"]')?.querySelectorAll('a');
    
    if (!subMenuItems) return;
    
    const currentIndex = Array.from(subMenuItems).indexOf(currentElement);
    
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        window.location.href = subItem.url;
        handleNavigationClick(subItem.title);
        break;
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % subMenuItems.length;
        (subMenuItems[nextIndex] as HTMLElement).focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex === 0 ? subMenuItems.length - 1 : currentIndex - 1;
        (subMenuItems[prevIndex] as HTMLElement).focus();
        break;
      case 'Escape':
        event.preventDefault();
        const parentButton = currentElement.closest('[role="menu"]')?.previousElementSibling?.querySelector('[role="button"]');
        if (parentButton) {
          (parentButton as HTMLElement).focus();
          (parentButton as HTMLElement).click(); // Close the submenu
        }
        break;
    }
  }
</script>
<Sidebar.Group>
  <Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
  <Sidebar.Menu role="navigation" aria-label="Main navigation">
    {#each items as item (item.title)}
      {@const itemActive = isItemActive(item)}
      <Collapsible.Root open={itemActive} class="group/collapsible">
        {#snippet child({ props })}
          <Sidebar.MenuItem {...props}>
            <Collapsible.Trigger>
              {#snippet child({ props })}
                <Sidebar.MenuButton 
                  {...props} 
                  tooltipContent={item.title}
                  data-active={itemActive}
                  class={itemActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                  {...getNavigationAriaAttributes(item, itemActive, !!item.items)}
                  aria-controls="submenu-{item.title.toLowerCase().replace(/\s+/g, '-')}"
                  role="button"
                  tabindex="0"
                  onkeydown={(e) => handleMainItemKeydown(e, item)}
                >
                  {#if item.icon}
                    <item.icon aria-hidden="true" />
                  {/if}
                  <span>{item.title}</span>
                  <ChevronRightIcon
                    class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    aria-hidden="true"
                  />
                </Sidebar.MenuButton>
              {/snippet}
            </Collapsible.Trigger>
            <Collapsible.Content>
              <Sidebar.MenuSub 
                id="submenu-{item.title.toLowerCase().replace(/\s+/g, '-')}"
                role="menu"
                aria-label="{item.title} submenu"
              >
                {#each item.items ?? [] as subItem (subItem.title)}
                  {@const subItemActive = isSubItemActiveLocal(subItem)}
                  <Sidebar.MenuSubItem role="menuitem">
                    <Sidebar.MenuSubButton 
                      data-active={subItemActive}
                      class={subItemActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                    >
                      {#snippet child({ props })}
                        <a 
                          href={subItem.url} 
                          {...props}
                          {...getNavigationAriaAttributes(subItem, subItemActive)}
                          class="flex items-center w-full focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2 rounded-md"
                          tabindex="0"
                          onclick={() => handleNavigationClick(subItem.title)}
                          onkeydown={(e) => handleSubItemKeydown(e, subItem)}
                        >
                          <span>{subItem.title}</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuSubButton>
                  </Sidebar.MenuSubItem>
                {/each}
              </Sidebar.MenuSub>
            </Collapsible.Content>
          </Sidebar.MenuItem>
        {/snippet}
      </Collapsible.Root>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>